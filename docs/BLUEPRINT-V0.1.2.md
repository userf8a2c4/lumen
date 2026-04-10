# MASTER BLUEPRINT V0.1.2: LUMEN OMNI-OS
## Refactorización Estructural Completa

**Arquitecto:** Gemini (DART/LU Engine)  
**Operadora:** Lucila  
**Asistente IA:** LU (Powered by Gemini)  
**Filosofía:** Resiliencia de Amazon (AC3) + Visibilidad de SpaceX + Soberanía de Datos Local + Evolución No-Code.

---

## 1. NAVEGACIÓN Y CONTROL DE INTERFAZ (Sidebar Táctico)

El Sidebar es el ancla de estabilidad de Lucila. No es solo un menú, es el selector de estados lógicos del sistema.

### Especificaciones Estéticas

- **Dimensiones:** Ancho fijo de `260px` (expandido) y `64px` (colapsado).
- **Color de Fondo:** `#000000` sólido (True Black).
- **Iconografía:** Glifos lineales de `24px`. Color activo: `#8A2BE2` (Violeta Eléctrico) con un *glow* exterior (drop-shadow) de `2px`.
- **Transiciones:** `300ms cubic-bezier(0.4, 0, 0.2, 1)`.

### Segmentos de Control

1. **[M] PANEL DE MISIÓN (Dashboard Central):** Carga el **Motor AC3** activo. Es el estado base de operación.
2. **[A] AGENDA (Google Calendar Integration):**
   - **Sync:** Fetching bidireccional cada 15 min vía Google API.
   - **UI:** Lista cronológica vertical. Eventos con tags operativos (ej: "Reunión", "Cierre") se resaltan con un borde lateral violeta.
   - **Acción:** Al clicar un evento, se pre-carga una "Nota de Junta" en el Cerebro.
3. **[C] CEREBRO (Santuario de Datos CRUD):** Base de datos documental local para expedientes de residentes.
4. **[D] DIRECTORIO (Contactos Estratégicos CRUD):** Gestión independiente de aliados y técnicos.
5. **[S] CONFIGURACIÓN (System Core & Editor):** Punto de acceso al **Editor Visual de Lógica** y ajustes de sistema.

---

## 2. GESTIÓN DE NOTAS Y ARCHIVOS (Cerebro & Evidence Vault)

Módulo diseñado para la **Auditoría de Evidencia** y memoria histórica de largo plazo.

### Operaciones CRUD Atómicas

- **Create:** Editor Markdown con auto-save cada 2 segundos o tras 50ms de inactividad de teclado.
- **Read:** Vista de flujo infinito con indexación local mediante `Lunr.js`.
- **Update:** Historial de versiones (snapshot log) para rastrear cambios en el comportamiento de residentes.
- **Delete:** Confirmación física de 3 segundos para evitar pérdida accidental.

### The Evidence Vault (Lightbox Pro)

- **Visualización:** Soporte para imágenes de alta resolución y PDFs.
- **Herramientas de Peritaje:**
  - **Zoom Óptico:** Hasta 400% mediante slider o scroll, fundamental para validar folios bancarios borrosos.
  - **Anotación Layer:** Capa transparente para marcar inconsistencias en documentos sin alterar el archivo original.
  - **Ajustes:** Contraste y brillo dinámico para mejorar legibilidad de capturas oscuras.

---

## 3. MOTOR DE DECISIÓN AC3 (Amazon Style Flow)

Estandarización de la atención para que cada problema se resuelva con la misma precisión técnica, hoy y en el futuro.

### Arquitectura de Capas

1. **Nivel 1 (Triaje):** Selección de macro-módulo (Finanzas, Legal, Técnico, Amenidades).
2. **Nivel 2 (Síntoma):** Selección del problema específico detectado.
3. **Nivel 3 (Validación Lógica):** Árbol de preguntas binarias (Sí/No). Ejemplo: "¿Presentó comprobante?", "¿Es reincidente?".
4. **Nivel 4 (Veredicto):** Emisión de la resolución final basada en la política cargada.

**Telemetría de Residentes:** El encabezado del motor muestra el historial previo del residente (extraído del Cerebro) para contextualizar el riesgo antes de decidir.

---

## 4. EDITOR VISUAL DE LÓGICA (No-Code Logic Designer)

Ubicado en Configuración, permite a Lucila ser la arquitecta de sus propias reglas de trabajo.

### Interfaz de Mapa Mental

- **Canvas:** Superficie infinita con grid oscuro.
- **Nodos Arrastrables:**
  - **Nodos de Decisión (Rombos):** Representan preguntas con dos salidas (Sí/No).
  - **Nodos de Acción (Rectángulos):** Definen el veredicto final.
  - **Nodos de Arsenal:** Enlaces directos a scripts de respuesta específicos.
- **Conectores:** Flechas magnéticas que definen el flujo de la lógica.

### Funcionalidad

- **Draft Mode:** Edición sin afectar el sistema en vivo.
- **Botón "Publicar":** Al presionar, el mapa visual se compila y actualiza instantáneamente el Motor AC3 operativo.
- **Utilidad:** Permite a Lucila adaptar el sistema a nuevas "mañas" de residentes o cambios en el reglamento sin intervención de Carlos.

---

## 5. CAPA DE INSTRUCCIÓN (Tooltips Instructivos)

Ayuda invisible y constante para eliminar la curva de aprendizaje y el miedo al sistema.

- **Diseño Visual:** Pequeños círculos violetas `(?)` ubicados junto a cada función compleja, botón o nodo del editor.
- **Comportamiento:** Aparecen al hacer *hover* con un efecto de desenfoque de fondo en el tooltip.
- **Estructura de Contenido (3 Niveles):**
  1. **[¿Qué es?]:** Nombre técnico y funcional de la herramienta.
  2. **[¿Para qué sirve?]:** Explicación del beneficio operativo para Lucila.
  3. **[Tip Pro]:** Consejo táctico basado en la metodología Amazon (ej: "Usa este nodo para blindarte legalmente ante reclamos de pagos").

---

## 6. EL ARSENAL & ASISTENTE LU (Ejecución e IA)

- **Scripts Dinámicos:** Plantillas que se auto-rellenan con datos del residente y del veredicto AC3 (monto, fecha, artículo del reglamento).
- **Asistente LU:**
  - **Contexto Total:** LU lee el paso actual del mapa mental y las notas del Cerebro.
  - **Interacción:** Lucila puede pedir: "LU, usa el veredicto de multa y redáctalo de forma amable pero firme, recordando que es su segunda falta según mis notas".

---

## 7. MÓDULO CENTINELA (Feedback & Telemetría Técnica)

**PROTOCOLO ESTRICTO:** Prohibido el envío de datos de personas (Lucila, residentes o clientes). Solo viaja telemetría mecánica.

### Métricas de Salud

- Latencia de carga de módulos y errores de consola (JavaScript/API).
- Mapa de calor de uso: ¿Qué nodos del árbol de decisión son los más/menos usados?

### Integración GitHub

- Apertura automática de `Issues` para errores críticos con el stack-trace completo.
- Reporte semanal de "Zonas de Fricción" para guiar la próxima refactorización de Carlos.

### Filtro Zero-Data

Script de sanitización basado en Regex que elimina cualquier rastro de nombres o montos antes de la transmisión.

---

## 8. ESPECIFICACIONES TÉCNICAS Y SEGURIDAD

| Área | Especificación |
|------|---------------|
| **Persistencia** | IndexedDB (Local-First). Los datos sensibles NUNCA salen de la computadora de Lucila. |
| **Seguridad** | Cifrado AES-256 para la base de datos local. |
| **Performance** | Optimización de imágenes vía WebP y transiciones de UI a 60fps. |
| **Disponibilidad** | 100% Funcional Offline para el Cerebro y el Motor AC3. |

---

## Roadmap de Implementación

| Fase | Módulo | Prioridad |
|------|--------|-----------|
| v0.6.0 | Motor AC3 — Triaje base (Finanzas, Legal, Técnico) | Alta |
| v0.6.1 | Agenda — Google Calendar sync read-only | Alta |
| v0.6.2 | Cerebro — Evidence Vault con zoom y anotaciones | Media |
| v0.7.0 | Editor Visual de Lógica (No-Code Designer) | Media |
| v0.7.1 | Tooltips Instructivos en todos los módulos | Baja |
| v0.8.0 | Módulo Centinela + telemetría GitHub | Baja |

---

*Documento generado el 2026-04-09. Versión base de implementación: LUMEN v0.5.4 SpaceX Stealth.*
