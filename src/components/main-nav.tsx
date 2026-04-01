"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ventas", label: "Ventas" },
  { href: "/costos", label: "Costos" },
  { href: "/gastos", label: "Gastos" },
  { href: "/retiros", label: "Retiros" },
  { href: "/configuracion-financiera", label: "Configuración" },
  { href: "/resumen-mensual", label: "Resumen mensual" },
  { href: "/historial", label: "Historial" },
  { href: "/asistente", label: "Asistente" },
];

export function MainNav() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, session, logoutUser } = useAuth();
  const publicLinks = [
    { href: "/", label: "Inicio" },
    { href: "/login", label: "Login" },
    { href: "/registro", label: "Registro" },
  ];
  const visibleLinks = isAuthenticated ? links : publicLinks;

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <header className="app-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold tracking-tight text-indigo-700">Ruzafa App</p>
          {isAuthenticated && session && (
            <p className="text-xs text-slate-500">Sesión: {session.email}</p>
          )}
        </div>
        {!isInitializing && isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            className="app-btn-secondary self-start"
          >
            Cerrar sesión
          </button>
        )}
      </div>
      <nav className="mt-3 flex flex-wrap gap-2">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
