export const FREE_PREVIEW_SETS = ['set_010', 'set_023']; // intermediate set yang gratis sebagai preview

export function isSetFree(set) {
  if (!set) return false;
  return set.difficulty === 'beginner' || FREE_PREVIEW_SETS.includes(set.id);
}
