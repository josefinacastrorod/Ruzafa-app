# Estado del proyecto

## Fecha de actualización
2026-03-31

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

## Estado Git (hoy)
- Rama actual: `main`
- Último commit: `040b976` (`Primer push`)
- Working tree: limpio (sin cambios pendientes antes de esta actualización de docs)

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
