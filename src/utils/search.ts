/** Lowercase and strip accents so "árabe" matches "arabe" and "Diseñador" matches "disenador". */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
