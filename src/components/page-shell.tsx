import type { AppIconName } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";

type PageShellProps = {
  title: string;
  description: string;
  icon?: AppIconName;
};

export function PageShell({ title, description, icon = "home" }: PageShellProps) {
  return <PageHeader title={title} description={description} icon={icon} />;
}
