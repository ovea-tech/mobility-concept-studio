import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: string }> = {
  // project_status
  draft: { label: "Entwurf", variant: "bg-muted text-muted-foreground" },
  active: { label: "Aktiv", variant: "bg-primary/10 text-primary" },
  submitted: { label: "Eingereicht", variant: "bg-amber-500/10 text-amber-700" },
  approved: { label: "Freigegeben", variant: "bg-emerald-500/10 text-emerald-700" },
  archived: { label: "Archiviert", variant: "bg-muted text-muted-foreground" },
  // monitoring_status
  pending: { label: "Ausstehend", variant: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Bearbeitung", variant: "bg-primary/10 text-primary" },
  compliant: { label: "Konform", variant: "bg-emerald-500/10 text-emerald-700" },
  non_compliant: { label: "Nicht konform", variant: "bg-destructive/10 text-destructive" },
  waived: { label: "Ausgenommen", variant: "bg-violet-500/10 text-violet-700" },
  // concept_version_status
  final: { label: "Final", variant: "bg-primary/10 text-primary" },
  superseded: { label: "Abgelöst", variant: "bg-muted text-muted-foreground" },
  // approval_status
  in_review: { label: "In Prüfung", variant: "bg-amber-500/10 text-amber-700" },
  rejected: { label: "Abgelehnt", variant: "bg-destructive/10 text-destructive" },
  withdrawn: { label: "Zurückgezogen", variant: "bg-muted text-muted-foreground" },
  // pack_status
  released: { label: "Veröffentlicht", variant: "bg-emerald-500/10 text-emerald-700" },
  // overdue (virtual)
  overdue: { label: "Überfällig", variant: "bg-destructive/10 text-destructive" },
  // rule_candidate_status
  inbox: { label: "Eingang", variant: "bg-muted text-muted-foreground" },
  triaged: { label: "Gesichtet", variant: "bg-amber-500/10 text-amber-700" },
  drafted: { label: "Entworfen", variant: "bg-primary/10 text-primary" },
  integrated: { label: "Integriert", variant: "bg-emerald-500/10 text-emerald-700" },
  discarded: { label: "Verworfen", variant: "bg-muted text-muted-foreground" },
  deprecated: { label: "Veraltet", variant: "bg-muted text-muted-foreground" },
  // rule_status
  candidate: { label: "Kandidat", variant: "bg-muted text-muted-foreground" },
  // measure status
  proposed: { label: "Vorgeschlagen", variant: "bg-muted text-muted-foreground" },
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
