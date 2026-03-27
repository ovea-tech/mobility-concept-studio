import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/30 mb-2.5" strokeWidth={1.5} />}
      <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-[12px] text-muted-foreground/70 mt-0.5 text-center max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
