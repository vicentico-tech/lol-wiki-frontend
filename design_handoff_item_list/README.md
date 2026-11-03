# Handoff: Vista de Objetos (/objetos)

## Overview
Pantalla completa con el catálogo de objetos, a la que se llega desde el botón **OBJETOS** de la
home. Mismo lenguaje que `/campeones`: panel lateral de filtros siempre visible en desktop +
rejilla de iconos cuadrados, aquí con **precio bajo cada icono** y una **barra de rareza** en el
borde inferior del icono. Al hacer clic se abre el **modal de detalle ya implementado**
(`app-item-detail`). Datos reales de **Data Dragon** (es_ES), una sola llamada a `item.json`.

## About the Design Files
`Vista Objetos.dc.html` es un **prototipo HTML de referencia** — no es código para copiar y
pegar. Contiene los tres tamaños uno al lado del otro compartiendo el mismo estado de filtros,
más el modal de detalle para ver el flujo completo.
Ids de referencia: **3a** desktop 1440×900 · **3b** tablet 834×1112 · **3c** móvil 390×844.
En el prototipo las vistas tablet/móvil renderizan solo los primeros 45/36 resultados (para
aligerar el lienzo); en Angular se renderiza la lista completa.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, clip-paths, estados hover y
comportamiento de filtros son finales.

## Arquitectura sugerida en Angular
1. **Ruta nueva** en `app.routes.ts`, junto a `campeones`:
   ```ts
   { path: 'objetos', loadComponent: () => import('./features/item-list/item-list.component')
       .then(m => m.ItemListComponent) }
   ```
   El botón `[OBJETOS]` de la home usa el mismo `@Input() route` de `NavButtonComponent` que ya
   se añadió para campeones.
2. **Nuevo componente** `features/item-list/item-list.component.ts` (standalone, `CommonModule`
   + `FormsModule` + `ItemDetailComponent`), con la misma estructura de señales que
   `ChampionListComponent` (`signal` + `computed` + `ChangeDetectionStrategy.OnPush`).
3. **Servicio**: usar **`RiotDataService.getItemCatalog()`** (no `getItems()`), porque devuelve
   `ItemDetailData` completo — `gold`, `tags`, `depth`, `from`, `into`, `stats` — que es lo que
   necesitan los filtros, y **comparte caché con el modal de detalle** (`getItemDetail`), así que
   abrir un objeto no dispara ninguna petición extra.
   Añadir a `ItemDetailData`: `depth?: number`, `plaintext?: string`,
   `maps?: Record<string, boolean>`, `inStore?: boolean`, `requiredAlly?: string`,
   `gold: { total: number; sell: number; purchasable: boolean }`.
4. **Modal**: `<app-item-detail [itemId]="selectedId" (close)="selectedId = null">` tal cual.

## Filtrado del catálogo (importante)
`item.json` trae ~500 entradas, muchas no comprables (objetos de Ornn, trinkets de tutorial,
mapas retirados). Quedarse solo con:
```ts
it.gold?.purchasable && it.gold.total > 0 && it.maps?.['11'] && !it.requiredAlly && it.inStore !== false
```
Resultado ≈ 200 objetos de Grieta del Invocador.

**Rareza** (derivada de `depth` + `into`, no viene como campo):
`legendary` si `depth >= 3` o (`depth === 2` y no tiene `into`) · `epic` si `depth === 2` ·
`basic` en el resto. Se pinta como barra de 3px al pie del icono:
legendario `#f4d37c`, épico `#0ac8b9`, básico `#5e6b74` (opacidad .85).

## Screens / Views

### 1. Desktop — 1440×900 (id 3a)
- **Fondo**: `public/background.jpg` a `opacity:.22` + velo
  `linear-gradient(90deg,rgba(3,4,6,.97),rgba(3,4,6,.8) 30%,rgba(3,4,6,.94))`.
- **Panel lateral** `width:296px`, borde derecho `1px solid rgba(120,90,40,.4)`, fondo
  `linear-gradient(180deg,rgba(18,16,11,.9),rgba(8,8,10,.95))`, **con scroll propio** (los
  filtros no caben en 900px):
  - "Volver al inicio" · título `OBJETOS` (Cinzel 700 1.85rem, gradiente dorado) ·
    subtítulo `{{visibles}} de {{total}} · parche {{version}}`.
  - **Buscador** hexagonal cian de 38px (idéntico al de campeones).
  - **Categoría**: lista vertical con recuento por categoría (Todos, Daño de ataque, Poder de
    habilidad, Vida, Armadura, Resist. mágica, Vel. de ataque, Crítico, Maná, Botas,
    Consumibles, Visión). Activa: fondo cian + borde `#0ac8b9`, número en `#7de9df`.
  - **Tipo**: chips paralelogramo Todos / Básico / Épico / Legendario.
  - **Precio**: chips Cualquiera / < 1000 / 1000–2500 / 2500–3500 / > 3500.
  - **Orden**: `<select>` (Precio ↑, Precio ↓, A→Z, Z→A) + interruptor
    **"Solo objetos finales"** (`!item.into.length`) con rombo cian cuando está activo.
  - **Objeto destacado**: aleatorio **entre los legendarios**, icono 64px con halo dorado,
    badge "DESTACADO" cian, nombre Cinzel y precio en Times. Clic → modal.
- **Área de rejilla**: barra de sección `"Todos los objetos · 204"` (o el nombre de la categoría)
  + "Limpiar filtros" solo si hay filtros activos; rejilla `repeat(8,1fr)`, `gap:22px 16px`,
  celda `aspect-ratio:1` con borde `#785a28`, esquinas biseladas de 10px y sombra
  `0 4px 10px rgba(0,0,0,.6)`; debajo **nombre** (Times `.8rem` `#c8aa6e`, máx. 2 líneas) y
  **precio** con rombo dorado de 8px.

### 2. Tablet — ≤1024px (id 3b)
Sin panel lateral: cabecera con botón volver (44×44), título, buscador de 280px. Debajo, dos
filas de filtros (categorías como chips; tipo + precio + `<select>` de orden a la derecha).
Destacado como **banner horizontal de 132px** con icono de 84px y `plaintext`.
Rejilla `repeat(5,1fr)`, `gap:24px 18px`, nombre `.88rem`. Un solo scroll vertical.

### 3. Móvil — ≤480px (id 3c)
Cabecera compacta (volver + título + `"{{visibles}} de {{total}}"`). Fila fija con buscador +
botón **"Filtros"** de 44px que despliega el panel plegable (categoría, tipo, precio, orden,
"Limpiar filtros"); el botón pasa a cian cuando está abierto. Destacado como tarjeta de 60px.
Rejilla `repeat(3,1fr)`, `gap:20px 14px`. **Todos los controles táctiles a 44px de alto.**

## Interactions & Behavior
- **Filtros combinables (AND)** aplicados **en cliente** sobre el catálogo cacheado — ninguna
  petición al cambiar un filtro:
  - búsqueda por `name` y por `plaintext` (`includes`, case-insensitive);
  - categoría contra `tags[]`;
  - tipo contra la rareza derivada;
  - precio por rango sobre `gold.total`;
  - "solo finales" descarta los que tienen `into`.
- **Orden**: precio asc/desc con desempate por `localeCompare(…, 'es')`; A→Z / Z→A.
- **Hover de tarjeta**: borde `#f0e6d2` + `box-shadow:0 0 0 1px #c8aa6e,0 0 20px rgba(200,170,110,.6)`.
  En tablet/móvil el mismo tratamiento en `:active`.
- **Clic en objeto** → `app-item-detail` con ese id. Cerrar con ✕, backdrop o `Esc`.
- **Dentro del modal**, los objetos de "Compuesto por" y "Se combina en" son **navegables**:
  cambian el `itemId` del propio modal sin cerrarlo (el `@Input() set itemId` ya recarga).
- **Skeleton**: 24 cuadrados `#161a1e` con `pulseSk 1.4s ease-in-out infinite` + barra de 9px.
- **Sin estadísticas**: ~20 de los objetos comprables no traen `stats` (consumibles, objetos
  de visión). El modal debe **ocultar el bloque "Estadísticas" completo** (encabezado incluido)
  cuando `stats` está vacío — aplica también al `ItemDetailComponent` actual.
- **Estado vacío**: rombo, "NINGÚN OBJETO COINCIDE", ayuda y botón "Limpiar filtros".
- **Error de red**: catálogo vacío con el mismo estado vacío, sin romper la UI.

## State Management
```ts
items = signal<ParsedItem[]>([])      // catálogo ya filtrado a comprables + rareza derivada
version = signal('')
loading = signal(true)
filters = signal({ q:'', cat:'all', tier:'all', price:'all', sort:'price-asc', onlyFinal:false })
selectedId = signal<string | null>(null)
featured = signal<ParsedItem | null>(null)   // legendario aleatorio al cargar
filtersOpen = signal(false)                  // solo móvil
filteredItems = computed(...)  // filtro + orden
```

## Design Tokens
Los mismos del proyecto:
- Dorados `#c8aa6e` / `#785a28`; gradiente de títulos
  `linear-gradient(180deg,#fffae3,#eac269 48%,#8f6014 58%,#f4d37c)`.
- Cian `#0ac8b9` (activo), `#7de9df` (texto sobre activo), `#c4d3df` (input),
  `#8b9ea8` / `#5e6b74` (secundario / terciario).
- Superficies `#0a0a0c`, `#12161a`, skeleton `#161a1e`, bordes `#23282d` / `#3e4b54`.
- Tipos: **Cinzel** (títulos y encabezados), **Times New Roman** (nombres y precios),
  **Roboto** (UI).
- Chip paralelogramo `clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%)`;
  celda biselada `polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)`.
- Moneda: rombo de 8px `linear-gradient(180deg,#f4d37c,#8f6014)` rotado 45°, nunca un emoji.

## Assets
- Icono de objeto: `RiotDataService.getItemIconUrl(`${id}.png`)`.
- Fondo: `public/background.jpg`, ya en el proyecto.
- **Guards de `src`**: no renderizar `<img>` hasta tener la versión del CDN (`*ngIf`).

## Responsive
Breakpoints del proyecto: **1024px** (cae el panel lateral → barra superior, rejilla a 5
columnas) y **480px** (3 columnas, filtros plegables, controles a 44px). Entre 481 y 767px,
4 columnas manteniendo el layout móvil.

## Files
- `Vista Objetos.dc.html` — prototipo de referencia con los tres tamaños + el modal de detalle.
