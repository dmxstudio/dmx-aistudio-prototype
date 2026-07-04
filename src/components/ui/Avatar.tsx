export function Avatar({
  name,
  size = 36,
  status = false,
}: {
  name: string
  size?: number
  status?: boolean
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-medium"
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {status && (
        <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-success ring-2 ring-surface" />
      )}
    </div>
  )
}
