import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="p-6">
        <EmptyState
          icon={Construction}
          title="In Entwicklung"
          description="Diese Seite wird in Kürze verfügbar sein."
        />
      </div>
    </div>
  );
}
