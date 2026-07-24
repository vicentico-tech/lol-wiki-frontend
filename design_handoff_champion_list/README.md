# Handoff: Vista de Campeones (/campeones)

## Overview
Pantalla completa con el catálogo de campeones, a la que se llega desde el botón **CAMPEONES**
de la home. Panel lateral de filtros siempre visible + rejilla densa de iconos cuadrados.
Al hacer clic en un campeón se abre el **modal de detalle ya implementado**
(`app-champion-detail`). Datos reales de **Data Dragon** (es_ES), una sola llamada a
`champion.json`.

## About the Design Files
`Vista Campeones.dc.html` es un **prototipo HTML de referencia** — no es código para copiar y
pegar. Contiene los tres tamaños uno al lado del otro (desktop, tablet, móvil) compartiendo el
mismo estado de filtros, más el modal de detalle para poder ver el flujo completo.
Ids de referencia: **2a** desktop 1440×900 · **2b** tablet 834×1112 · **2c** móvil 390×844.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, clip-paths, estados hover y
comportamiento de filtros son finales.

## Arquitectura sugerida en Angular
1. **Añadir router al proyecto** — `app.routes.ts` está vacío hoy:
   ```ts
   export const routes: Routes = [
     { path: '', component: HomeComponent },
     { path: 'campeones', loadComponent: () => import('./features/champion-list/champion-list.component')
         .then(m => m.ChampionListComponent) },
   ];
   ```
   `main-layout.component.html` debe pasar de `<app-home>` fijo a `<router-outlet>`.
   `app.config.ts` necesita `provideRouter(routes)`.
2. **`NavButtonComponent`**: añadir `@Input() route?: string` (o un `@Output() action`) para que
   `[CAMPEONES]` navegue. No cambiar su estilo — la vista reutiliza ese mismo lenguaje visual
   en el botón "Volver".
3. **Nuevo componente** `features/champion-list/champion-list.component.ts` (standalone,
   `CommonModule` + `FormsModule`).
4. **Servicio**: `RiotDataService.getChampions()` **ya sirve** — `champion.json` incluye
   `tags`, `info.difficulty`, `partype` y `key`, así que los cuatro filtros y los dos órdenes
   salen de esa única llamada, sin peticiones extra. Añadir esos campos a la interfaz
   `ChampionData` (`tags: string[]`, `info: { difficulty: number }`, `partype: string`,
   `key: string`).
5. **Modal**: reutilizar `<app-champion-detail [championId]="…" (close)="selectedId = null">`
   tal cual, con un solo campo `selectedId: string | null`.

## Screens / Views

### 1. Desktop — 1440×900 (id 2a)
- **Fondo**: `public/background.jpg` a `opacity:.22` + velo
  `linear-gradient(90deg,rgba(3,4,6,.97),rgba(3,4,6,.8) 30%,rgba(3,4,6,.94))`.
- **Panel lateral**, `width:296px`, altura completa, borde derecho
  `1px solid rgba(120,90,40,.4)`, fondo `linear-gradient(180deg,rgba(18,16,11,.9),rgba(8,8,10,.95))`:
  - Enlace "Volver al inicio" (flecha + texto, `#8b9ea8` → `#0ac8b9` en hover).
  - Título `CAMPEONES` en **Cinzel 700 1.85rem** con el gradiente dorado del proyecto.
  - Subtítulo `{{visibles}} de {{total}} · parche {{version}}` en `#785a28`, `.68rem`,
    `letter-spacing:2.5px`, uppercase.
  - **Buscador**: caja hexagonal cian (`clip-path` con puntas de 11px, fondo
    `linear-gradient(90deg,#0b2233,#123c58)`, `inset 0 0 0 1px #0ac8b9` +
    `inset 0 0 12px rgba(10,200,185,.28)`), altura 38px — mismo lenguaje que la search bar
    de la home, en versión reducida.
  - **Rol** como lista vertical: cada fila muestra el nombre + **recuento de campeones de ese
    rol**. Inactiva: fondo `rgba(16,19,22,.6)`, borde `#23282d`, texto `#8b9ea8`.
    Activa: fondo `linear-gradient(90deg,rgba(18,60,88,.85),rgba(11,34,51,.35))`,
    borde `#0ac8b9`, texto `#f0e6d2`, número en `#7de9df`. Incluye "Todos los roles".
  - **Dificultad** como chips paralelogramo: Todas / Baja (1-3) / Media (4-7) / Alta (8-10).
  - **Recurso** y **Orden** como `<select>` oscuros (`#12161a`, borde `#3e4b54`, 34px).
  - **Campeón destacado** al final del panel: tarjeta de 230px con el arte `loading` del
    campeón, degradado inferior, badge "DESTACADO" cian, nombre en Cinzel y título en
    Times italic. Clic → abre el modal de ese campeón.
  - Cada sección lleva encabezado Cinzel `.68rem` `letter-spacing:2.5px` + línea degradada dorada.
- **Área de rejilla**:
  - Barra de sección: `"Todos los campeones · 168"` (o `"Magos · 32"` al filtrar por rol) en
    Cinzel `.8rem` `letter-spacing:3.5px` + línea degradada; botón **"Limpiar filtros"**
    (borde `#3e4b54`) que aparece **solo si hay algún filtro activo**.
  - Rejilla `repeat(10,1fr)`, `gap:18px 12px`, celdas `aspect-ratio:1`:
    icono con borde `1px #785a28`, fondo `#000`, esquinas biseladas
    `polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)`,
    sombra `0 4px 10px rgba(0,0,0,.6)`.
  - Debajo del icono: **nombre siempre visible** (Times New Roman `.82rem` `#c8aa6e`, centrado)
    y 3 **pips de dificultad** de 12×3px (`#c8aa6e` los activos, `#2a2e33` el resto).

### 2. Tablet — ≤1024px (id 2b)
El panel lateral desaparece: cabecera con botón de volver (44×44), título, y buscador de 280px
a la derecha. Destacado pasa a **banner horizontal de 170px** con el splash. Filtros como dos
filas de chips (rol / dificultad) + los dos `<select>` alineados a la derecha.
Rejilla `repeat(6,1fr)`, `gap:20px 14px`, nombre a `.9rem`. Todo en un único scroll vertical.

### 3. Móvil — ≤480px (id 2c)
Cabecera compacta (volver + título + `"{{visibles}} de {{total}}"`). Fila fija con buscador +
botón **"Filtros"** (44px de alto) que despliega un **panel plegable** con rol, dificultad,
recurso, orden y "Limpiar filtros" — el botón se pinta en cian cuando el panel está abierto.
Destacado como tarjeta de 150px. Rejilla `repeat(3,1fr)`, `gap:18px 12px`.
**Todos los controles táctiles miden 44px de alto o más.**

## Interactions & Behavior
- **Filtros combinables** (AND) y aplicados **en cliente** sobre el catálogo ya cacheado —
  sin llamadas por cambio de filtro:
  - búsqueda por nombre **y por título** (`includes`, case-insensitive);
  - rol contra `tags[]`;
  - dificultad por tramos sobre `info.difficulty` (≤3 baja, ≤7 media, resto alta);
  - recurso por igualdad con `partype` (las opciones del select se generan de los `partype`
    presentes en los datos, ya vienen en español).
- **Orden**: A→Z / Z→A con `localeCompare(…, 'es')`; "Más recientes"/"Más antiguos" por
  `parseInt(key)` descendente/ascendente (aproxima el orden de lanzamiento).
- **Hover de tarjeta**: borde a `#f0e6d2` + `box-shadow: 0 0 0 1px #c8aa6e, 0 0 20px rgba(200,170,110,.6)`.
  En móvil, el mismo tratamiento en `:active`.
- **Clic en campeón** → abre `app-champion-detail` con ese id. Cerrar con ✕ o backdrop.
- **Destacado**: campeón aleatorio elegido al cargar (`Math.random()` sobre el catálogo).
  Clic → mismo modal.
- **Skeleton** mientras carga: rejilla de 40 cuadrados `#161a1e` con `animation:pulseSk 1.4s
  ease-in-out infinite` (opacidad .35 ↔ .7) + una barra de 9px simulando el nombre.
- **Estado vacío** (0 resultados tras filtrar): rombo con lupa, "NINGÚN CAMPEÓN COINCIDE",
  ayuda breve y botón "Limpiar filtros".
- **Error de red**: no romper la UI — rejilla vacía con el mismo estado vacío.

## State Management
```ts
champions$: Observable<ChampionData[]>   // RiotDataService.getChampions() (cacheado)
version: string
filters = { q: '', role: 'all', diff: 'all', res: 'all', sort: 'az' }
selectedId: string | null = null   // abre el modal de detalle
featured: ChampionData | null      // aleatorio al cargar
filtersOpen = false                // solo móvil (panel plegable)
```
La lista filtrada se calcula con un getter/`computed` o un pipe puro sobre `champions` +
`filters`; no hace falta estado derivado extra.

## Design Tokens
Mismos tokens que el resto del proyecto (`styles.scss` / handoff champion-detail):
- Dorados: `#c8aa6e` (texto/bordes), `#785a28` (bordes suaves, texto secundario),
  gradiente de títulos `linear-gradient(180deg,#fffae3,#eac269 48%,#8f6014 58%,#f4d37c)`.
- Cian: `#0ac8b9` (activo/acento), `#7de9df` (texto sobre activo), `#c4d3df` (input),
  `#8b9ea8` / `#5e6b74` (secundario y terciario).
- Superficies: `#0a0a0c` fondo, `#12161a` controles, `#161a1e` skeleton, bordes `#23282d` / `#3e4b54`.
- Tipografías: **Cinzel** (títulos y encabezados de sección), **Times New Roman** (nombres de
  campeón, botones tipo nav), **Roboto** (UI, chips, inputs).
- Chip paralelogramo: `clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%)`.

## Assets
- Icono de campeón: `.../cdn/{version}/img/champion/{image.full}` (`RiotDataService.getChampionIconUrl`).
- Destacado desktop/móvil: arte `loading` (`/cdn/img/champion/loading/{id}_0.jpg`, vertical);
  tablet usa el `splash` (`/cdn/img/champion/splash/{id}_0.jpg`, horizontal).
- Fondo de pantalla: `public/background.jpg`, ya en el proyecto.
- **Guards de `src`**: no renderizar ningún `<img>` hasta que la URL exista (`*ngIf="iconUrl"`)
  — evita 404s en consola mientras llega la versión del CDN.

## Responsive
Breakpoints del proyecto: **1024px** (cae el panel lateral → barra superior, rejilla a 6
columnas) y **480px** (rejilla a 3 columnas, filtros plegables, controles a 44px).
Entre 481px y 767px se puede usar una rejilla de 4 columnas manteniendo el layout móvil.

## Files
- `Vista Campeones.dc.html` — prototipo de referencia con los tres tamaños + el modal de detalle.
