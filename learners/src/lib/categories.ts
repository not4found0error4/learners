export const BOOK_CATEGORIES = [
  { slug: 'nursery', label: 'Nursery', group: 'level' },
  { slug: 'lkg', label: 'LKG', group: 'level' },
  { slug: 'ukg', label: 'UKG', group: 'level' },
  { slug: 'class-1-8', label: 'Class 1-8', group: 'level' },
  { slug: 'maths', label: 'Maths', group: 'subject' },
  { slug: 'english', label: 'English', group: 'subject' },
  { slug: 'hindi', label: 'Hindi', group: 'subject' },
  { slug: 'gk', label: 'GK', group: 'subject' },
  { slug: 'others', label: 'Others', group: 'subject' },
  { slug: 'art', label: 'Art', group: 'subject' },
] as const;

export const LEVEL_CATEGORIES = BOOK_CATEGORIES.filter(({ group }) => group === 'level');
export const SUBJECT_CATEGORIES = BOOK_CATEGORIES.filter(({ group }) => group === 'subject');

export type BookCategorySlug = (typeof BOOK_CATEGORIES)[number]['slug'];

export function getCategoryLabel(slug: string): string | undefined {
  return BOOK_CATEGORIES.find((category) => category.slug === slug)?.label;
}

export function isValidCategorySlug(slug: string): slug is BookCategorySlug {
  return BOOK_CATEGORIES.some((category) => category.slug === slug);
}
