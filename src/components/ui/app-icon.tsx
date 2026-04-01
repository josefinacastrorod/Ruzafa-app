import type { SVGProps } from "react";

export type AppIconName =
  | "dashboard"
  | "movements"
  | "sales"
  | "costs"
  | "expenses"
  | "withdrawals"
  | "summary"
  | "history"
  | "settings"
  | "assistant"
  | "auth"
  | "home";

type AppIconProps = {
  name: AppIconName;
  className?: string;
};

function IconBase({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    />
  );
}

export function AppIcon({ name, className = "h-5 w-5" }: AppIconProps) {
  const sharedClass = `${className} shrink-0`;

  switch (name) {
    case "dashboard":
      return (
        <IconBase className={sharedClass}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </IconBase>
      );
    case "movements":
      return (
        <IconBase className={sharedClass}>
          <path d="M4 7h12" />
          <path d="M12 3l4 4-4 4" />
          <path d="M20 17H8" />
          <path d="M12 13l-4 4 4 4" />
        </IconBase>
      );
    case "sales":
      return (
        <IconBase className={sharedClass}>
          <path d="M5 19h14" />
          <path d="M7 16V9" />
          <path d="M12 16V5" />
          <path d="M17 16v-4" />
        </IconBase>
      );
    case "costs":
      return (
        <IconBase className={sharedClass}>
          <path d="M5 5h14" />
          <path d="M19 5l-8 14" />
          <path d="M7 19h10" />
        </IconBase>
      );
    case "expenses":
      return (
        <IconBase className={sharedClass}>
          <path d="M7 4h10l1 5H6l1-5Z" />
          <path d="M6 9h12l-1 9H7L6 9Z" />
          <path d="M10 13h4" />
        </IconBase>
      );
    case "withdrawals":
      return (
        <IconBase className={sharedClass}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 12h.01M17 12h.01" />
        </IconBase>
      );
    case "summary":
      return (
        <IconBase className={sharedClass}>
          <path d="M5 20V8" />
          <path d="M10 20V4" />
          <path d="M15 20v-7" />
          <path d="M20 20v-4" />
        </IconBase>
      );
    case "history":
      return (
        <IconBase className={sharedClass}>
          <path d="M12 7v5l3 2" />
          <circle cx="12" cy="12" r="8" />
          <path d="M4 4v4h4" />
        </IconBase>
      );
    case "settings":
      return (
        <IconBase className={sharedClass}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5.8a7 7 0 0 0-1.6-.9L14.5 3h-5l-.3 2.9a7 7 0 0 0-1.6.9l-2.5-.8-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.5-.8a7 7 0 0 0 1.6.9l.3 2.9h5l.3-2.9a7 7 0 0 0 1.6-.9l2.5.8 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
        </IconBase>
      );
    case "assistant":
      return (
        <IconBase className={sharedClass}>
          <rect x="5" y="5" width="14" height="12" rx="3" />
          <path d="M9 10h.01M15 10h.01" />
          <path d="M9 14h6" />
          <path d="M12 5V3M8 21h8" />
        </IconBase>
      );
    case "auth":
      return (
        <IconBase className={sharedClass}>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          <path d="M12 14v2" />
        </IconBase>
      );
    case "home":
      return (
        <IconBase className={sharedClass}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </IconBase>
      );
    default:
      return null;
  }
}
