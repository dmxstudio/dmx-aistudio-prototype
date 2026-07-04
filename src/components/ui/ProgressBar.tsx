export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={className}>
      <div className="h-2 rounded-full bg-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(value)}%` }}
        />
      </div>
    </div>
  )
}
