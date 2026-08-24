export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StarRank"
      role="img"
    >
      <rect x="15" y="61" width="24" height="44" rx="4" fill="#1E293B" />
      <rect x="48" y="39" width="24" height="66" rx="4" fill="#1E293B" />
      <rect x="81" y="72" width="24" height="33" rx="4" fill="#1E293B" />
      <path
        d="M60.000,15.500L62.469,22.602L69.986,22.755L63.994,27.298L66.172,34.495L60.000,30.200L53.828,34.495L56.006,27.298L50.014,22.755L57.531,22.602Z"
        fill="#F59E0B"
      />
    </svg>
  )
}
