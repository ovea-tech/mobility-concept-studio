import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: string }> = {
  draft: { label: "Entwurf", variant: "bg-muted text-muted-foreground" },
  active: { label: "Aktiv", variant: "bg-primary/10 text-primary" },
  in_review: { label: "In Prüfung", variant: "bg-amber-500/10 text-amber-700" },
  approved: { label: "Freigegeben", variant: "bg-emerald-500/10 text-emerald-700" },
  released: { label: "Veröffentlicht", variant: "bg-emerald-500/10 text-emerald-700" },
  submitted: { label: "Eingereicht", variant: "bg-teal-500/10 text-teal-700" },
  pending: { label: "Ausstehend", variant: "bg-amber-500/10 text-amber-700" },
  completed: { label: "Abgeschlossen", variant: "bg-emerald-500/10 text-emerald-700" },
  overdue: { label: "Überfällig", variant: "bg-destructive/10 text-destructive" },
  rejected: { label: "Abgelehnt", variant: "bg-destructive/10 text-destructive" },
  candidate: { label: "Kandidat", variant: "bg-muted text-muted-foreground" },
  proposed: { label: "Vorgeschlagen", variant: "bg-muted text-muted-foreground" },
  retired: { label: "Archiviert", variant: "bg-muted text-muted-foreground" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-[1px] text-[11px] font-medium leading-[18px]",
        config.variant,
        className
      )}
    >
      {config.label}
    </span>
  );
}
