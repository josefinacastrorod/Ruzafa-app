import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon";
import { PageHeader } from "@/components/ui/page-header";

const movementLinks = [
  {
    href: "/ventas",
    title: "Ventas",
    description: "Registrar y editar ingresos por ventas del emprendimiento.",
    icon: "sales" as const,
    tone: "text-emerald-700",
  },
  {
    href: "/costos",
    title: "Costos",
    description: "Cargar costos directos asociados a la producción.",
    icon: "costs" as const,
    tone: "text-amber-700",
  },
  {
    href: "/gastos",
    title: "Gastos",
    description: "Registrar gastos operativos y del negocio.",
    icon: "expenses" as const,
    tone: "text-orange-700",
  },
];

export default function MovimientosPage() {
  return (
    <section className="app-page">
      <PageHeader
        title="Movimientos"
        description="Gestiona en un solo lugar los módulos de ventas, costos y gastos."
        icon="movements"
      />

      <div className="app-grid-3">
        {movementLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="app-card block p-5 transition hover:-translate-y-0.5 hover:border-indigo-200"
          >
            <span className={`app-icon-chip ${item.tone}`}>
              <AppIcon name={item.icon} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-base font-semibold text-indigo-950">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
