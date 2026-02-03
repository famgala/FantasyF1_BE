import { Button } from "./Button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  to?: string;
  variant?: "primary" | "secondary";
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  actions = [],
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className="empty-state empty-state--compact" role="status" aria-live="polite">
        <div className="empty-state__icon">{icon}</div>
        <div className="empty-state__content">
          <h3 className="empty-state__title">{title}</h3>
          <p className="empty-state__description">{description}</p>
          {actions.length > 0 && (
            <div className="empty-state__actions">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  to={action.to}
                  variant={action.variant || (index === 0 ? "primary" : "secondary")}
                  size="sm"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {actions.length > 0 && (
        <div className="empty-state__actions">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              to={action.to}
              variant={action.variant || (index === 0 ? "primary" : "secondary")}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
