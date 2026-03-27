import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Aktiv", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_review: { label: "In Prüfung", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Freigegeben", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  released: { label: "Veröffentlicht", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  submitted: { label: "Eingereicht", className: "bg-teal-50 text-teal-700 border-teal-200" },
  pending: { label: "Ausstehend", className: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Abgeschlossen", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "Überfällig", className: "bg-red-50 text-red-700 border-red-200" },
  rejected: { label: "Abgelehnt", className: "bg-red-50 text-red-700 border-red-200" },
  candidate: { label: "Kandidat", className: "bg-muted text-muted-foreground border-border" },
  proposed: { label: "Vorgeschlagen", className: "bg-muted text-muted-foreground border-border" },
  retired: { label: "Archiviert", className: "bg-muted text-muted-foreground border-border" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
