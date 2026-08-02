interface EmptyStateProps {
  emoji: string
  title: string
  subtitle?: string
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden>
        {emoji}
      </span>
      <p className="empty-state-title">{title}</p>
      {subtitle && <p className="empty-state-sub">{subtitle}</p>}
    </div>
  )
}
