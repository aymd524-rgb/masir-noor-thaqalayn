/**
 * Accept only same-origin application paths for post-authentication navigation.
 * Protocol-relative URLs and backslash variants are rejected.
 */
export function safeAuthRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }

  if (/[\u0000-\u001f\u007f]/.test(value)) return undefined;

  try {
    const target = new URL(value, "https://masir-noor.invalid");
    if (target.origin !== "https://masir-noor.invalid") return undefined;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return undefined;
  }
}
