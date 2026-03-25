# PharmaPOS — Phase 1 Scaffold

Offline-first pharmacy POS for small pharmacies in Malawi.  
Electron + React + TypeScript + Vite. SQLite added in Phase 2.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 10+** (comes with Node.js)
- **Windows 10/11 or Ubuntu 22+** (the target pharmacy OS)
- **Python 3.10+** and C++ build tools (needed by `better-sqlite3` native compilation)

### Windows: install build tools

```bash
npm install -g windows-build-tools
# OR install Visual Studio Build Tools with "Desktop development with C++" workload
```

### Ubuntu: install build tools

```bash
sudo apt-get install -y build-essential python3
```

## Setup

```bash
# Clone or copy the project, then:
cd pharmapos
npm install

# Rebuild native modules for Electron's Node version
npx electron-rebuild
```

If `electron-rebuild` fails, try:

```bash
npx electron-vite build
# Then retry:
npx electron-rebuild -f -w better-sqlite3
```

## Run in Development

```bash
npm run dev
```

This starts:
- Vite dev server for the React renderer (hot reload)
- Electron main process
- The app window opens automatically

## Verify Phase 1 is Working

After `npm run dev`, confirm all of these:

1. **Window opens** with a dark lock screen showing the PharmaPOS logo
2. **IPC status** shows "System ready" (green) at the bottom of the lock screen
3. **PIN entry works**: type any 4 digits → unlocks as Owner. Type `0000` → unlocks as Cashier
4. **Sidebar navigation** shows all pages for Owner, only POS for Cashier
5. **All 6 pages render**: POS, Products, Inventory, Reports, Backup & Sync, Settings
6. **Lock** works: press Ctrl+L → returns to lock screen
7. **Header** shows "System Ready" (IPC connected) and "Offline" (sync placeholder)
8. **Sidebar collapse** toggle works
9. **Console** (DevTools → F12) shows:
   - `[IPC] Connected: <timestamp>`
   - `[App] Info: { version, dataPath, platform, arch }`

## Phase 1 Checklist

| Item | Status |
|------|--------|
| Electron window launches | ◻ |
| IPC ping/pong works (main ↔ renderer) | ◻ |
| Lock screen renders with PIN pad | ◻ |
| PIN unlock works (any 4 digits) | ◻ |
| Role-based nav (owner sees all, cashier sees POS only) | ◻ |
| All 6 pages render with placeholders | ◻ |
| Ctrl+L locks the screen | ◻ |
| Sidebar collapse works | ◻ |
| App info displays (version, platform) | ◻ |
| Hot reload works in dev mode | ◻ |

## Project Structure

```
pharmapos/
├── electron-builder.yml          # Packaging config (Windows/Linux installers)
├── electron.vite.config.ts       # Vite config for main + preload + renderer
├── package.json
├── tsconfig.json                 # Base TypeScript config
├── tsconfig.node.json            # Main + preload TS config
├── tsconfig.web.json             # Renderer TS config
├── resources/                    # App icons (add before packaging)
│
└── src/
    ├── shared/
    │   └── types.ts              # IPC API contract, shared types, nav items
    │
    ├── main/                     # Electron main process (Node.js)
    │   ├── index.ts              # Window creation, lifecycle, single-instance
    │   └── ipc.ts                # IPC handler registration
    │
    ├── preload/                  # Bridge between main and renderer
    │   ├── index.ts              # contextBridge.exposeInMainWorld
    │   └── index.d.ts            # Type declarations for window.api
    │
    └── renderer/                 # React app (runs in Chromium)
        ├── index.html            # Entry HTML
        └── src/
            ├── main.tsx          # React entry point
            ├── app.css           # Global styles + Tailwind + design tokens
            ├── App.tsx           # Root component: auth state, routing, keyboard shortcuts
            ├── components/
            │   ├── Layout.tsx    # Sidebar + header + content wrapper
            │   ├── Sidebar.tsx   # Navigation, role filtering, user info, lock
            │   └── Header.tsx    # Page title, IPC status, sync status
            └── pages/
                ├── LockScreen.tsx  # PIN entry with keypad
                ├── POS.tsx         # Search + cart layout (placeholder)
                ├── Products.tsx    # Product table (placeholder)
                ├── Inventory.tsx   # Stock alerts (placeholder)
                ├── Reports.tsx     # Sales summary (placeholder)
                ├── BackupSync.tsx  # Backup + sync controls (placeholder)
                └── Settings.tsx    # All settings sections (placeholder)
```

## IPC Architecture

```
RENDERER (React)           PRELOAD (bridge)           MAIN (Node.js)
─────────────────          ────────────────           ──────────────
window.api.ping()  ──►  ipcRenderer.invoke()  ──►  ipcMain.handle()
       ◄── Promise ────────── result ──────────────── return value
```

- **Renderer** calls `window.api.*` methods (type-safe via `ElectronApi`)
- **Preload** translates to `ipcRenderer.invoke(channel, ...args)`
- **Main** handles via `ipcMain.handle(channel, handler)`
- All calls are async (Promise-based)
- Context isolation is ON: renderer cannot access Node.js directly

### Current IPC Channels (Phase 1)

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `system:ping` | renderer → main | Verify IPC connection |
| `system:get-app-info` | renderer → main | Get version, data path, platform |

### Channels to Add in Future Phases

| Phase | Channels |
|-------|----------|
| 2 | `db:*` — database queries and mutations |
| 3 | `auth:*` — PIN verify, PIN set, user lookup |
| 4 | `products:*` — CRUD, search, batch management |
| 6 | `sales:*` — checkout, void |
| 7 | `print:*` — receipt print, test print, list printers |
| 10 | `backup:*` — create, restore, list |
| 11 | `sync:*` — push, pull, status |

## Build for Distribution

```bash
# Build for current platform
npm run package

# Build specifically for Windows
npm run package:win

# Build for Linux
npm run package:linux
```

Output goes to `dist/`. The Windows installer is an `.exe`, Linux produces an `.AppImage`.

## Next Phase

**Phase 2: SQLite integration + full schema**
- Install better-sqlite3 in main process
- Create all 7 tables via migration files
- Seed with test data
- IPC bridge: renderer queries products through main process
