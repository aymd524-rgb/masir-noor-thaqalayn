// Public, read-only Quran page proxy. Quran Foundation credentials stay server-side.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", ...extra },
  });

type TokenResult = { access_token: string; expires_in: number };
let tokenValue: string | null = null;
let tokenExpiresAt = 0;
let tokenInFlight: Promise<string> | null = null;\nlet basmalaInFlight: Promise<string[]> | null = null;

function endpoints() {
  const env = Deno.env.get("QF_ENV") ?? "prelive";
  if (env === "production") {
    return {
      auth: "https://oauth2.quran.foundation",
      api: "https://apis.quran.foundation",
    };
  }
  if (env === "prelive") {
    return {
      auth: "https://prelive-oauth2.quran.foundation",
      api: "https://apis-prelive.quran.foundation",
    };
  }
  throw new Error("Invalid QF_ENV");
}

async function requestToken(): Promise<string> {
  const clientId = Deno.env.get("QF_CLIENT_ID");
  const clientSecret = Deno.env.get("QF_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Quran Foundation credentials are not configured");

  const { auth } = endpoints();
  const basic = btoa(`${clientId}:${clientSecret}`);
  const scope = Deno.env.get("QF_SCOPE") ?? "content.quran.read";
  const response = await fetch(`${auth}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MasirNoorThaqalayn/1.0",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }),
  });
  if (!response.ok) throw new Error(`QF token endpoint returned ${response.status}`);
  const token = (await response.json()) as TokenResult;
  if (!token.access_token || !Number.isFinite(token.expires_in)) throw new Error("Invalid token response");
  tokenValue = token.access_token;
  tokenExpiresAt = Date.now() + token.expires_in * 1000;
  return tokenValue;
}

async function getToken(): Promise<string> {
  if (tokenValue && Date.now() < tokenExpiresAt - 30_000) return tokenValue;
  if (!tokenInFlight) {
    tokenInFlight = requestToken().finally(() => {
      tokenInFlight = null;
    });
  }
  return tokenInFlight;
}

async function qfGet(path: string): Promise<unknown> {
  const clientId = Deno.env.get("QF_CLIENT_ID");
  if (!clientId) throw new Error("Quran Foundation client ID is not configured");
  const { api } = endpoints();

  const call = async (token: string) =>
    fetch(`${api}/content/api/v4${path}`, {
      headers: { "x-auth-token": token, "x-client-id": clientId },
    });

  let response = await call(await getToken());
  if (response.status === 401) {
    tokenValue = null;
    tokenExpiresAt = 0;
    response = await call(await getToken());
  }
  if (!response.ok) throw new Error(`QF Content API returned ${response.status}`);
  return response.json();
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    return json({ error: "Page must be an integer from 1 to 604" }, 400);
  }

  try {
    const pageResult = await qfGet(
      `/verses/by_page/${page}?mushaf=5&words=true&word_fields=text_uthmani,line_number&per_page=50&page=1`,
    );

    const pageData = pageResult as {
      verses?: { verse_key?: string; words?: unknown[] }[];
      pagination?: { next_page?: number | null };
    };
    if (!Array.isArray(pageData.verses) || pageData.verses.length === 0) {
      return json({ error: "No verses returned for this page" }, 502);
    }

    // Basmala is fetched only for pages that begin a surah requiring it.
    const needsBasmala = pageData.verses.some((verse) => {
      const [surah, ayah] = (verse.verse_key ?? "").split(":").map(Number);
      return ayah === 1 && surah > 1 && surah !== 9;
    });
    let basmala: string[] = [];
    if (needsBasmala) {
      if (!basmalaInFlight) {
        basmalaInFlight = qfGet("/verses/by_key/1:1?words=true&word_fields=text_uthmani")
          .then((data) => {
            const response = data as { verse?: { words?: { char_type_name?: string; text_uthmani?: string }[] } };
            return (response.verse?.words ?? [])
              .filter((word) => word.char_type_name === "word")
              .map((word) => word.text_uthmani ?? "")
              .filter(Boolean);
          })
          .catch((error) => {
            basmalaInFlight = null;
            throw error;
          });
      }
      basmala = await basmalaInFlight;
    }

    return json(
      { page, verses: pageData.verses, basmala },
      200,
      { "Cache-Control": "public, max-age=600, s-maxage=86400" },
    );
  } catch {
    // Do not return provider bodies or token-related details to public callers.
    return json({ error: "Quran text service is temporarily unavailable" }, 502);
  }
});
