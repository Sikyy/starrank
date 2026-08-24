export const CATEGORIES = ['kr', 'jp', 'cn', 'na'] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  kr: '韩国',
  jp: '日本',
  cn: '内地',
  na: '北美',
}

/** The picker shows an "All" option then the four category boards. */
export const CATEGORY_PICKER: Array<{ value: Category | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'kr', label: '韩国' },
  { value: 'jp', label: '日本' },
  { value: 'cn', label: '内地' },
  { value: 'na', label: '北美' },
]
