# Estado del proyecto

## Fecha de actualización
2026-04-01

## Etapas
- [x] Setup base
- [x] Auth
- [x] DB
- [x] Ventas
- [x] Costos
- [x] Gastos
- [x] Retiros
- [x] Configuración
- [x] Resumen
- [x] Historial
- [x] Asistente
- [x] Rediseño visual UI
- [ ] Deploy

## Último avance consolidado
La app ya incluye flujo completo financiero:
- Registro de ventas, costos, gastos y retiros
- Configuración financiera editable con historial
- Resumen mensual con fórmulas:
  - utilidad = ventas - costos - gastos
  - disponible = utilidad - retiros
- Historial extendido con filtros por rango de meses y exportación (CSV + vista lista para impresión/PDF)
- Asistente interno conectado a datos reales del historial mensual (métricas acumuladas, mejor/peor mes por ganancia real, alertas por meses sin configuración vigente)
- Rediseño visual integral mobile-first:
  - nuevo sistema visual global (paleta, cards, formularios, botones, sombras, estados)
  - navegación superior mejorada con iconos y estado activo destacado
  - encabezados reutilizables con iconografía por sección
  - mejoras de presentación en dashboard, movimientos, ventas, costos, gastos, retiros, resumen mensual, historial, configuración y auth

## Navegación y UI (2026-04-01)
- Navbar simplificado con 5 secciones principales para usuarios autenticados:
  - Dashboard
  - Movimientos
  - Retiros
  - Resumen
  - Historial
- Nueva página `/movimientos` para agrupar accesos a:
  - Ventas (`/ventas`)
  - Costos (`/costos`)
  - Gastos (`/gastos`)
- Eliminada la sección "Accesos rápidos" del dashboard para reducir duplicación visual.
- Se mantienen rutas existentes y lógica de negocio sin cambios.
- Refresh visual aplicado de forma consistente en toda la app sin modificar lógica ni servicios.

## Estado Git (hoy)
- Rama actual: `main`
- Último commit: `040b976` (`Primer push`)
- Working tree: con cambios locales de navegación/UI sin commit

## Pendientes operativos
- Conectar repositorio a Vercel
- Configurar variables de entorno del proyecto en Vercel (Supabase y auth)
- Ejecutar primer deploy y validar funcionamiento en producción (especialmente mobile-first)

## Próximo paso
1. Deploy en Vercel con variables de entorno
2. QA post-deploy (altas/ediciones en ventas, costos, gastos, retiros; resumen mensual; historial; asistente)
3. Iteración de producto: recomendaciones accionables por tendencias y vista comparativa trimestral

## Bloqueos
Ninguno técnico en código.
Pendiente acceso/autorización de plataforma para publicar (GitHub/Vercel).
