import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h1>
          {description && (
            <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
