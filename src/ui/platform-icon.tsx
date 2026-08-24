import type { PlatformId } from '../domain/identity.ts'

// Small inline brand glyphs shown in the identity field when a platform is
// selected. fill=currentColor so they inherit the surrounding text color.

export function PlatformIcon({ platform, size = 18 }: { platform: PlatformId; size?: number }) {
  switch (platform) {
    case 'x':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.6 5.82A4.28 4.28 0 0 1 15.9 3h-3.1v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.77a5.76 5.76 0 0 0-.78-.06 5.7 5.7 0 1 0 5.7 5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.61-1.48Z" />
        </svg>
      )
    case 'douyin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.6 5.82A4.28 4.28 0 0 1 15.9 3h-3.1v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.77a5.76 5.76 0 0 0-.78-.06 5.7 5.7 0 1 0 5.7 5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.61-1.48Z" />
        </svg>
      )
    case 'rednote':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3.5c2.5 0 5 .8 5 .8v13.4s-2.5.8-5 .8-5-.8-5-.8V4.3s2.5-.8 5-.8Z" />
          <path d="M9.5 8.5h5M9.5 12h3" />
        </svg>
      )
    case 'weibo':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.9 9.3c-2.6.6-4.9 2.5-4.6 4.8.3 2.2 2.7 3.2 5 2.7 2.3-.5 4.2-2.2 4.4-4.1.2-1.7-1.4-2.9-3.2-3-.7 0-1.2.2-1.6.6ZM18.5 4.5c-1.5-.3-3 .5-3.3 1.9-.3 1.2.4 2.4 1.6 2.8 1.4.4 2.8-.4 3.1-1.8.2-1.1-.3-2.2-1.4-2.9Z" />
        </svg>
      )
  }
}
