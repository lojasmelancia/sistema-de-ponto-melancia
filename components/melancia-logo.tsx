export function MelanciaLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Fatia de melancia */}
        <path
          d="M4 6 A22 22 0 0 1 28 6 L16 28 Z"
          fill="var(--color-accent)"
          transform="rotate(180 16 16)"
        />
        <path
          d="M6 8 A18 18 0 0 1 26 8 L16 25 Z"
          fill="oklch(0.95 0.05 20)"
          transform="rotate(180 16 16)"
        />
        <path
          d="M4 6 A22 22 0 0 1 28 6 L25.5 10 A17 17 0 0 0 6.5 10 Z"
          fill="var(--color-primary)"
          transform="rotate(180 16 16)"
        />
        <circle cx="13" cy="12" r="1" fill="var(--color-primary)" />
        <circle cx="18" cy="13" r="1" fill="var(--color-primary)" />
        <circle cx="15.5" cy="16" r="1" fill="var(--color-primary)" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight">
        Melancia
      </span>
    </span>
  )
}
