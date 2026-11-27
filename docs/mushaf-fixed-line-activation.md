# Activating the fixed-line Mushaf reader

The app currently defaults to AlQuran Cloud's Uthmani text, which has page boundaries but does not provide printed Mushaf line numbers. It therefore uses verse-flow layout and must not be presented as an exact 15-line hifz Mushaf.

The fixed-line source is implemented as a read-only Supabase Edge Function at `supabase/functions/mushaf-page/index.ts`. It requests the KFGQPC Hafs Mushaf (Quran Foundation `mushaf=5`) and preserves the source's line numbers.

## Required Supabase secrets

Set these as Edge Function secrets in the Supabase project (never in Vite/Lovable frontend variables):

- `QF_CLIENT_ID`
- `QF_CLIENT_SECRET`
- `QF_ENV` = `production` for production credentials, or `prelive` for prelive credentials
- `QF_SCOPE` = `content.quran.read` (optional; this is the default)

Quran Foundation must issue the client credentials and grant access to the required content API. Do not substitute invented credentials.

## Deploy and activate

1. Deploy the `mushaf-page` Edge Function from this repository to the linked Supabase project, with `verify_jwt=false` as specified in `supabase/config.toml`. The endpoint is read-only and validates page numbers 1–604.
2. Add the secrets above in Supabase Edge Function secrets.
3. Set the frontend build variable `VITE_MUSHAF_SOURCE=quran-foundation-edge` and ensure the existing Supabase URL and publishable key are configured.
4. Rebuild and deploy the frontend.
5. Verify pages 1, 2, a mid-Qur'an page, and pages 604; compare the source line positions against the selected printed KFGQPC Hafs hifz Mushaf before calling it fully verified.

## Test

Request `GET /functions/v1/mushaf-page?page=1` with the project's publishable `apikey` header. The response should include `page`, `verses`, and `basmala`; each word must include its source `line_number`. Never include Quran Foundation client secret in the request or frontend.

Until this function is deployed and credentials are configured, the app continues using AlQuran Cloud's verse-flow source. That fallback is complete Uthmani text but not exact printed 15-line page layout.
