"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { AppIconName } from "@/components/ui/app-icon";
import { AppIcon } from "@/components/ui/app-icon";

const appLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/movimientos", label: "Movimientos", icon: "movements" as const },
  { href: "/costos-por-collar", label: "Costos por collar", icon: "costs" as const },
  { href: "/retiros", label: "Retiros", icon: "withdrawals" as const },
  { href: "/resumen-mensual", label: "Resumen", icon: "summary" as const },
  { href: "/historial", label: "Historial", icon: "history" as const },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isInitializing, session, logoutUser } = useAuth();
  const publicLinks = [
    { href: "/", label: "Inicio", icon: "home" as const },
    { href: "/login", label: "Login", icon: "auth" as const },
    { href: "/registro", label: "Registro", icon: "auth" as const },
  ];
  const visibleLinks = isAuthenticated ? appLinks : publicLinks;

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <header className="app-card sticky top-3 z-20 border-white/80 bg-white/90 p-4 backdrop-blur-md sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-bold tracking-tight text-indigo-950">Ruzafa App</p>
          {isAuthenticated && session && (
            <p className="text-xs text-slate-500">Sesión activa: {session.email}</p>
          )}
        </div>
        {!isInitializing && isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            className="app-btn-secondary self-start lg:self-auto"
          >
            Cerrar sesión
          </button>
        )}
      </div>
      <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-indigo-300 bg-indigo-600 text-white shadow-[0_10px_22px_-16px_rgba(67,56,202,0.9)]"
                  : "border-indigo-100 bg-indigo-50/90 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-100",
              ].join(" ")}
            >
              <AppIcon
                name={link.icon as AppIconName}
                className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-indigo-500"}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
