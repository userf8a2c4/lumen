# LUMEN

**LUMEN** — Herramienta de asistencia laboral para agentes de atención al cliente.

> *LUMEN* nace de **LU**cila + **MEN**te/Memoria. En latín, *lumen* significa luz o claridad — porque en medio del caos informativo, esta herramienta aporta claridad a los procesos.

---

## Stack tecnológico

- **Electron** — Aplicación de escritorio Windows
- **React 19** — Interfaz de usuario
- **SQLite** vía `better-sqlite3` — Base de datos local
- **TailwindCSS** — Estilos
- **Anthropic SDK** — Integración con Claude AI
- **electron-builder** — Generación de instalador `.exe`
- **electron-updater** — Auto-actualización desde GitHub Releases

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Base de Conocimiento | Gestión de políticas por departamento (texto o scraping de URL) |
| Búsqueda Instantánea | Búsqueda full-text con fragmentos destacados y filtro por departamento |
| Directorio de Escalación | Contactos clave con criterios de cuándo contactarlos |
| Asistente de Caso | Análisis de casos con IA usando las políticas como contexto |
| Casos de Ejemplo | Casos resueltos como referencia, vinculados a cada política |
| Configuración | API Key (cifrada), selector de modelo, actualizaciones |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)
- Windows 10/11

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/lumen-app.git
cd lumen-app

# Instalar dependencias
npm install
```

## Desarrollo local

```bash
# Iniciar en modo desarrollo (Vite + Electron en paralelo)
npm run dev
```

Esto levanta el servidor de Vite en `http://localhost:5173` y abre Electron conectado a él. Los cambios en React se reflejan en tiempo real con HMR.

## Generar el instalador .exe

```bash
# Build de producción + empaquetado
npm run package
```

El instalador se genera en la carpeta `release/`.

---

## Publicar una nueva versión

El proyecto usa **GitHub Actions** para compilar y publicar automáticamente.

### Pasos:

1. **Actualiza la versión** en `package.json`:
   ```bash
   npm version patch   # 1.0.0 → 1.0.1
   # o
   npm version minor   # 1.0.0 → 1.1.0
   # o
   npm version major   # 1.0.0 → 2.0.0
   ```

2. **Push del tag** a GitHub:
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions** se activa automáticamente al detectar el tag `v*`, compila el `.exe` y lo publica como GitHub Release.

4. Los usuarios con la app instalada recibirán la notificación de actualización automáticamente.

### Configuración necesaria para publicación

En `electron-builder.yml`, reemplaza los valores de `publish`:

```yaml
publish:
  provider: github
  owner: TU_USUARIO_GITHUB   # ← tu usuario de GitHub
  repo: lumen-app             # ← nombre del repositorio
```

---

## Estructura del proyecto

```
lumen/
├── .github/workflows/
│   └── release.yml           # CI/CD para auto-build y release
├── src/
│   ├── main/
│   │   ├── main.js           # Proceso principal de Electron
│   │   ├── preload.js        # Bridge seguro renderer↔main
│   │   ├── database.js       # SQLite con FTS5
│   │   ├── scraper.js        # Extracción de contenido web
│   │   └── updater.js        # Auto-actualización
│   └── renderer/
│       ├── index.html
│       ├── index.css
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── LoadingScreen.jsx
│           ├── TitleBar.jsx
│           ├── Sidebar.jsx
│           ├── Modal.jsx
│           ├── UpdateBanner.jsx
│           ├── KnowledgeBase/
│           ├── Search/
│           ├── Contacts/
│           ├── Assistant/
│           ├── Examples/
│           └── Settings/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── electron-builder.yml
└── README.md
```

---

## Seguridad

- La **API Key** se almacena cifrada usando `safeStorage` de Electron (DPAPI en Windows), nunca en texto plano.
- El renderer usa `contextIsolation: true` y `nodeIntegration: false`.
- Toda la comunicación renderer↔main pasa por IPC handlers explícitos vía `contextBridge`.

## Licencia

MIT
