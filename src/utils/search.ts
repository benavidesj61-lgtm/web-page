/** Lowercase, accent-free text so "decant" matches "Décant". Shared by build and browser code. */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
