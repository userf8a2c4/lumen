@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: AC3 redesign + section name personalization v0.5.19

AC3 — Rediseno completo (3 columnas):
- Columna izquierda: Panel de plantillas de texto con 10 categorias
  (SALUDO, PREGUNTAS, CONFIRMACION, DISCULPA, AGRADECIMIENTO, AUSENCIA,
  TARJETA DE ACCESO, REEMBOLSO, CONFIGURACIONES, DESPEDIDA)
  Copiado rapido al portapapeles, edicion y creacion inline por categoria
- Centro: Grid de RAMAS con constructor visual grafico de pasos
  (Paso, Decision, Accion, Escalacion, Fin — reordenables con flechas)
- Columna derecha: Configuracion/Contactos/Emergencia, Top 5 politicas,
  widget de Google Calendar, templates de email por rama,
  barra LU Chat IA colapsable integrada en la base del panel
- 3 nuevas tablas DB: ac3_branches, ac3_text_templates, ac3_email_templates
- 21 plantillas de texto sembradas por defecto al primer arranque
- Layout edge-to-edge para AC3 (sin padding extra)

Personalizacion de nombres de secciones:
- Nueva seccion en Configuracion -> Nombres de secciones
- Lucila puede renombrar: Dashboard, Decisiones, Biblioteca,
  Directorio, Notas, Configuracion a cualquier nombre
- Boton de restablecer a nombres originales
- Cambios reflejados inmediatamente en el sidebar
- Guardado en SQLite userData — persiste en todas las actualizaciones

Persistencia de datos garantizada:
- Todo dato en userData/lumen.db sobrevive actualizaciones NSIS
- Tablas con CREATE IF NOT EXISTS, columnas con ALTER + try/catch,
  seeds con conteo previo — nunca se sobreescriben datos del usuario"
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo main pushed!
) else (
    echo Push failed.
    pause
)
