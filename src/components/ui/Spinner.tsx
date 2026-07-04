// iOS-style activity indicator — 12 bars fading in sequence. Pure CSS, no deps.
// Color follows `currentColor` (set text-* on a parent). Keyframe `iosSpinFade` lives in index.css.
const BARS = 12

export function Spinner({ size = 28, className = '' }: { size?: number; className?: string }) {
  const barW = Math.max(1.5, size * 0.08)
  const barH = size * 0.27
  const radius = size * 0.32
  const dur = 1.1

  return (
    <span
      data-ios-spinner
      role="status"
      aria-label="Cargando"
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full bg-current"
          style={{
            width: barW,
            height: barH,
            marginLeft: -barW / 2,
            marginTop: -barH / 2,
            transform: `rotate(${i * (360 / BARS)}deg) translateY(-${radius}px)`,
            animation: `iosSpinFade ${dur}s linear infinite`,
            animationDelay: `${(i / BARS) * dur - dur}s`,
          }}
        />
      ))}
    </span>
  )
}
