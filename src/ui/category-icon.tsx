import type { Category } from '../domain/category.ts'

// Small inline glyphs for the category tabs, styled like outbid's category
// chips (All / regions). fill=currentColor so they inherit the label color.

export function CategoryIcon({ category, size = 15 }: { category: Category | 'all'; size?: number }) {
  switch (category) {
    case 'all':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      )
    case 'kr':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5l1.3 2.9 3.2.3-2.4 2.1.7 3.1-2.8-1.7-2.8 1.7.7-3.1-2.4-2.1 3.2-.3L12 2.5ZM8 16h8a1 1 0 0 1 1 1v3H7v-3a1 1 0 0 1 1-1Z" />
        </svg>
      )
    case 'jp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
        </svg>
      )
    case 'cn':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.2l2.4 5.2 5.6.6-4.1 3.8 1.1 5.6L12 14.8l-5 2.6 1.1-5.6L4 8l5.6-.6L12 2.2Z" />
        </svg>
      )
    case 'na':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3s-3.2 3.6-3.2 6.4c0 2 1.4 3.4 3.2 3.4s3.2-1.4 3.2-3.4C15.2 6.6 12 3 12 3Z" />
          <path d="M8.2 14h7.6c1 1.3 1.6 2.6 1.6 3.6 0 1.9-1.5 2.9-3.4 2.9h-4c-1.9 0-3.4-1-3.4-2.9 0-1 .6-2.3 1.6-3.6Z" />
        </svg>
      )
  }
}
