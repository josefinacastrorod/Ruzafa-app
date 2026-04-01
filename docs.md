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
- [x] Balance general
- [x] Costos por collar
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
- Nueva vista de balance acumulado (`/balance-general`) con:
  - ventas/costos/gastos totales históricos
  - ganancia total acumulada
  - ahorro y retiro acumulados (sugeridos) según configuración vigente por mes
  - manejo de meses sin configuración financiera sin romper cálculos
  - gráfico de evolución de ganancia mensual
- Rediseño visual integral mobile-first:
  - nuevo sistema visual global (paleta, cards, formularios, botones, sombras, estados)
  - navegación superior mejorada con iconos y estado activo destacado
  - encabezados reutilizables con iconografía por sección
  - mejoras de presentación en dashboard, movimientos, ventas, costos, gastos, retiros, resumen mensual, historial, configuración y auth
- Dashboard principal corregido y rediseñado (2026-04-01):
  - se reemplazó el dashboard estático (valores `"-"`) por carga real desde Supabase
  - ahora permite elegir mes y recalcular en vivo:
    - ventas, costos, gastos, ganancia real
    - monto fijo a guardar, restante, retiro sugerido y ahorro sugerido
  - se añadió en el mismo dashboard una sección de acumulados históricos:
    - ventas/costos/gastos/ganancia acumulados
    - ahorro y retiro acumulados según configuración vigente de cada mes
  - se reutilizó lógica financiera existente con servicio compartido para evitar duplicación
  - se manejan casos borde sin romper UI:
    - mes sin movimientos
    - mes sin configuración vigente
    - historial vacío o con meses sin configuración
- Nueva sección independiente de producto `/costos-por-collar` (2026-04-01):
  - permite crear/editar/eliminar fichas por collar con precio de venta y costo unitario
  - soporta dos modos de costo:
    - manual (`manual_cost`)
    - calculado por insumos (`unit_cost * quantity_used`)
  - muestra por collar:
    - costo unitario
    - precio de venta
    - ganancia por unidad
    - margen (%)
  - almacena datos en tablas dedicadas:
    - `collar_products`
    - `collar_product_components`
  - no impacta `sales`, `costs`, `expenses`, `financial_settings` ni el resumen mensual

## Navegación y UI (2026-04-01)
- Navbar actualizado con 6 secciones principales para usuarios autenticados:
  - Dashboard
  - Movimientos
  - Costos por collar
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
1. QA funcional dirigido al nuevo dashboard (cambio de mes, actualización en vivo, casos sin datos y sin configuración)
2. Deploy en Vercel con variables de entorno
3. QA post-deploy completo (ventas/costos/gastos/retiros, resumen mensual, historial, dashboard, asistente)

## Bloqueos
Ninguno técnico en código.
Pendiente acceso/autorización de plataforma para publicar (GitHub/Vercel).
