/** Normalize Persian and Arabic-Indic numerals to ASCII digits. */
export function normalizePageDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persian >= 0) return String(persian);
    return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
  });
}

/** Keep only numeric page-entry characters after numeral normalization. */
export function sanitizePageInput(value: string): string {
  return normalizePageDigits(value).replace(/[^0-9]/g, "");
}

/** Parse a page number only when it falls within the available Mushaf range. */
export function parsePageInput(value: string, maxPage = 604): number | null {
  const normalized = normalizePageDigits(value).trim();
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const page = Number(normalized);
  return Number.isSafeInteger(page) && page >= 1 && page <= maxPage ? page : null;
}
