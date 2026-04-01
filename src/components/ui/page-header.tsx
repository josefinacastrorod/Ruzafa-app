import type { AppIconName } from "@/components/ui/app-icon";
import { AppIcon } from "@/components/ui/app-icon";

type PageHeaderProps = {
  title: string;
  description: string;
  icon: AppIconName;
  badge?: string;
};

export function PageHeader({ title, description, icon, badge }: PageHeaderProps) {
  return (
    <div className="app-card app-page-header">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="app-icon-chip" aria-hidden>
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
        {badge && <span className="app-soft-badge">{badge}</span>}
      </div>
      <h1 className="mt-4 app-title">{title}</h1>
      <p className="app-subtitle">{description}</p>
    </div>
  );
}
