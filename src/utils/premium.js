export const FREE_PREVIEW_SETS = ['set_010', 'set_023']; // intermediate set yang gratis sebagai preview

export function isSetFree(set) {
  if (!set) return false;
  return set.difficulty === 'beginner' || FREE_PREVIEW_SETS.includes(set.id);
}

export function isSetNew(set) {
  if (!set || !set.isNew) return false;
  if (!set.createdAt) return true; // Default to showing "New" if no date is specified

  const createdDate = new Date(set.createdAt);
  const currentDate = new Date();
  const diffDays = (currentDate - createdDate) / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 14; // Valid for 14 days
}
