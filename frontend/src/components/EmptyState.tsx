
export interface EmptyStateAction {
  display?: string;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {children && <div className="empty-state__children">{children}</div>}
    </div>
  );
}
