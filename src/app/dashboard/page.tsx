import Link from "next/link";

export default function DashboardPage() {
  return (
    <section className="app-page">
      <div className="app-card p-5">
        <h1 className="app-title">Dashboard</h1>
        <p className="app-subtitle">
          Vista rápida de tus módulos financieros. Revisa cada sección para cargar o editar datos.
        </p>
      </div>

      <div className="grid gap-3">
        <article className="app-metric-card">
          <p className="app-metric-label">Ventas del mes</p>
          <p className="app-metric-value">-</p>
        </article>
        <article className="app-metric-card">
          <p className="app-metric-label">Costos del mes</p>
          <p className="app-metric-value">-</p>
        </article>
        <article className="app-metric-card">
          <p className="app-metric-label">Gastos del mes</p>
          <p className="app-metric-value">-</p>
        </article>
        <article className="app-metric-card app-metric-highlight">
          <p className="app-metric-label">Utilidad estimada</p>
          <p className="app-metric-value">-</p>
        </article>
      </div>

      <div className="app-card p-5">
        <h2 className="app-section-title">Accesos rápidos</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link className="app-btn-secondary text-center" href="/ventas">
            Ventas
          </Link>
          <Link className="app-btn-secondary text-center" href="/costos">
            Costos
          </Link>
          <Link className="app-btn-secondary text-center" href="/gastos">
            Gastos
          </Link>
          <Link className="app-btn-secondary text-center" href="/retiros">
            Retiros
          </Link>
          <Link className="app-btn-secondary text-center" href="/resumen-mensual">
            Resumen
          </Link>
          <Link className="app-btn-secondary text-center" href="/historial">
            Historial
          </Link>
          <Link className="app-btn-secondary text-center" href="/configuracion-financiera">
            Configuración
          </Link>
        </div>
      </div>
    </section>
  );
}
