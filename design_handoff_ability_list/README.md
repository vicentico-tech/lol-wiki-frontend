# Handoff: Vista de Habilidades (/habilidades)

## Overview
Pantalla completa con el catálogo global de habilidades (pasivas, Q, W, E, R de todos los
campeones) y, en una segunda pestaña, los **hechizos de invocador**. Se llega desde el botón
**HABILIDADES** de la home. Mismo lenguaje que `/campeones` y `/objetos`: panel lateral de
filtros en desktop + rejilla de iconos cuadrados. Cada icono lleva una **insignia de tecla**
(P/Q/W/E/R) en la esquina inferior izquierda y, debajo, nombre de la habilidad y del campeón.
Al hacer clic se abre un **modal de detalle** (nuevo, ver más abajo).

## About the Design Files
`Vista Habilidades.dc.html` es un **prototipo HTML de referencia**, no código para copiar. Contiene
los tres tamaños uno junto a otro compartiendo estado, más el modal.
Ids: **4a** desktop 1440×900 · **4b** tablet 834×1112 · **4c** móvil 390×844.
Tablet/móvil renderizan solo los primeros 45/36 resultados en el prototipo; en Angular se
renderiza la lista completa (o con `@defer`/virtual scroll, ver Rendimiento).

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, clip-paths y comportamiento son finales.

## Arquitectura sugerida en Angular
1. **Ruta** en `app.routes.ts`, junto a `campeones` y `objetos`:
   ```ts
   { path: 'habilidades', loadComponent: () => import('./features/ability-list/ability-list.component')
       .then(m => m.AbilityListComponent) }
   ```
   El botón `[HABILIDADES]` de la home usa el mismo `@Input() route` de `NavButtonComponent`.
2. **Componente** `features/ability-list/ability-list.component.ts` (standalone, `CommonModule` +
   `FormsModule`), con `signal` + `computed` + `ChangeDetectionStrategy.OnPush`, como
   `ChampionListComponent` e `ItemListComponent`.
3. **Servicio**: añadir a `RiotDataService`
   - `getAbilityCatalog(): Observable<{ spells: AbilityRow[]; summoners: AbilityRow[]; version: string }>`
     que lee `/cdn/{v}/data/es_ES/championFull.json` y `summoner.json` en un `forkJoin`, mapea a
     `AbilityRow` y cachea con `shareReplay(1)`.
   - **Usar `championFull.json`, no `champion/{id}.json`**: una sola petición (~3–4 MB) en lugar de
     ~170. Para no bloquear, `AbilityRow` es un modelo plano ya derivado; no guardar el JSON crudo.
   - URLs de iconos: pasivas `img/passive/{image.full}`, habilidades y hechizos `img/spell/{image.full}`.
     Añadir `getPassiveIconUrl()` y `getSpellIconUrl()` si no existen.
4. **Modal**: componente nuevo `app-ability-detail` (`@Input() ability`, `@Output() close`), mismo
   chrome que `app-item-detail` (clip-path octogonal, cierre con ✕, backdrop y `Esc`).
5. **"Ver campeón"** → `router.navigate(['/campeones'], { queryParams: { open: ownerId } })`, o
   la ruta de detalle que ya exista; en el prototipo solo cierra el modal.

## Modelo de datos
```ts
interface AbilityRow {
  id: string;            // `${champId}_${key}` o id del hechizo (p. ej. 'SummonerFlash')
  key: 'P'|'Q'|'W'|'E'|'R'|'S';   // S = hechizo de invocador
  name: string;
  owner: string;         // nombre del campeón, o 'Hechizo de invocador'
  ownerId: string|null;  // id Data Dragon del campeón; null en invocador
  icon: string;
  desc: string;          // description sin HTML (ver abajo)
  cost: 'mana'|'energy'|'hp'|'none'|'other';
  range: 'self'|'short'|'mid'|'long';
  cd: number;            // primer valor de cooldownBurn; -1 si no aplica
  stats: { label: string; value: string }[];   // Enfriamiento, Coste, Alcance, Rangos
}
```

## Derivación de campos (importante)
Data Dragon no trae estos valores normalizados:
- **Descripción**: usar `description` (no `tooltip`, que contiene plantillas `{{ e1 }}` sin
  resolver). Quitar HTML: `<br>` → espacio, eliminar etiquetas, colapsar espacios.
- **`cost`**: `costBurn === '0'` o `costType` "Sin coste" → `none`; contiene "Maná" → `mana`;
  "Energía" → `energy`; "Vida"/"Salud" → `hp`; el resto (Furia, Flujo…) → `other`.
  La pasiva es siempre `none`.
- **`range`** (de `rangeBurn`): no numérico o ≤0 ("self") → `self`; ≤500 `short`; ≤900 `mid`;
  >900 `long`.
- **`cd`**: `parseFloat(cooldownBurn)` = valor al **nivel 1**; no numérico → -1 (las pasivas van
  al final en orden por enfriamiento). En el modal se muestran todos los rangos
  (`cooldownBurn.replace(/\//g,' / ') + ' s'`).
- **Tecla**: el índice del array `spells` → `['Q','W','E','R'][i]`; la pasiva es `P`.

## Screens / Views

### 1. Desktop — 1440×900 (4a)
- **Fondo**: `public/background.jpg` a `opacity:.22` + velo
  `linear-gradient(90deg,rgba(3,4,6,.97),rgba(3,4,6,.8) 30%,rgba(3,4,6,.94))`.
- **Panel lateral** `width:296px`, scroll propio. De arriba abajo:
  "Volver al inicio" · título `HABILIDADES` (Cinzel 700 1.85rem, gradiente dorado) · subtítulo
  `{{visibles}} de {{total}} · parche {{version}}` · **pestañas** *Campeones / Invocador* (38px,
  la activa en cian) · **buscador** hexagonal (busca en nombre de habilidad **y** de campeón) ·
  **Tecla** (lista vertical con recuento: Todas, Pasiva, Q, W, E, R · Definitiva) · **Coste**
  (chips: Todos, Maná, Energía, Vida, Sin coste, Otro) · **Alcance** (chips: Cualquiera, Propio,
  Corto, Medio, Largo) · **Orden** (`<select>`: Campeón A→Z, Habilidad A→Z, Enfriamiento ↑/↓) ·
  **Destacada** (una definitiva aleatoria; icono 64px, badge "DEFINITIVA", nombre y campeón).
- **Rejilla** `repeat(9,1fr)`, `gap:22px 14px`. Celda `aspect-ratio:1`, borde `#785a28`, esquinas
  biseladas de 10px; **insignia de tecla** abajo-izquierda (18px de alto, fondo
  `rgba(3,4,6,.88)`, texto y bordes superior/derecho en `#c8aa6e`; **R en `#f4d37c`**, **P en
  `#0ac8b9`); nombre en Times `.78rem` `#c8aa6e` (2 líneas máx.); campeón en Roboto `.68rem`
  `#8b9ea8` con elipsis.
- **Pestaña Invocador**: se **ocultan** Tecla, Coste y Alcance (no aplican); sin insignia de tecla;
  la fila secundaria muestra "Hechizo de invocador". Quedan buscador y orden.

### 2. Tablet — ≤1024px (4b)
Sin panel lateral. Cabecera con volver (44×44), título y buscador de 280px. Debajo, barra de
filtros: pestañas + chips de tecla en una fila; chips de coste y alcance + `<select>` de orden a la
derecha en la siguiente. Destacada como **banner de 132px** (icono 84px, extracto de la descripción
a 2 líneas). Rejilla `repeat(5,1fr)`, `gap:24px 18px`. Un solo scroll vertical.

### 3. Móvil — ≤480px (4c)
Cabecera compacta, fila fija buscador + botón **Filtros** (44px, cian al abrirse). El panel
plegable contiene pestañas, Tecla, Coste y alcance, Orden y "Limpiar filtros" (max-height 520px con
scroll interno). Destacada como tarjeta de 60px. Rejilla `repeat(3,1fr)`, `gap:20px 14px`.
**Todos los controles táctiles a 44px de alto.**

### 4. Modal de detalle
Ancho máx. 580px, `max-height:86vh`, mismo octógono y animación `modalIn .3s` que el de objetos.
Cabecera: icono 78px con halo dorado, nombre (Cinzel 1.6rem, gradiente), etiqueta de tecla en cian
("Tecla Q", "Pasiva", "Definitiva · R", "Invocador") y etiqueta del campeón en dorado. Cuerpo:
cuadrícula 2×2 de estadísticas (Enfriamiento, Coste, Alcance, Rangos), caja de descripción con
borde izquierdo cian y, si hay `ownerId`, botón **"Ver campeón · {{nombre}}"**.
Para hechizos de invocador las estadísticas son Enfriamiento, Nivel requerido, Modos y Tipo.

## Interactions & Behavior
- **Filtros combinables (AND)**, en cliente sobre el catálogo cacheado; ninguna petición al filtrar.
- **Cambiar de pestaña** conserva buscador y orden; Tecla/Coste/Alcance se conservan en el estado
  pero solo se aplican en la pestaña Campeones.
- **"Limpiar filtros"** solo aparece si hay algún filtro activo; resetea buscador, tecla, coste y
  alcance (no el orden).
- **Orden por campeón**: `localeCompare(…, 'es')` por campeón y, dentro, P → Q → W → E → R.
- **Hover** de tarjeta: borde `#f0e6d2` + `box-shadow:0 0 0 1px #c8aa6e,0 0 20px rgba(200,170,110,.6)`;
  en táctil, el mismo tratamiento en `:active`.
- **Skeleton**: 27 cuadrados `#161a1e` con `pulseSk 1.4s ease-in-out infinite` + barra de 9px.
- **Estado vacío**: rombo, "NINGUNA HABILIDAD COINCIDE", ayuda y botón "Limpiar filtros".
- **Error de red**: catálogos vacíos → mismo estado vacío, sin romper la UI.

## State Management
```ts
spells = signal<AbilityRow[]>([]); summoners = signal<AbilityRow[]>([]);
version = signal(''); loading = signal(true);
tab = signal<'spells'|'summ'>('spells');
filters = signal({ q:'', key:'all', cost:'all', range:'all', sort:'champ' });
selected = signal<AbilityRow | null>(null);
featured = signal<AbilityRow | null>(null);   // R aleatoria al cargar
filtersOpen = signal(false);                  // solo móvil
filteredItems = computed(...)                 // dataset según tab + filtros + orden
```

## Rendimiento
~800 tarjetas en la pestaña Campeones. Con `OnPush` y `@for (…; track item.id)` es asumible en
desktop. En tablet/móvil usar `cdk-virtual-scroll-viewport` o paginar por bloques de 60 con
"Cargar más" si hay jank. Las imágenes con `loading="lazy"` y `width/height` fijos.
No renderizar `<img>` hasta tener la versión del CDN.

## Design Tokens
Los mismos del proyecto:
- Dorados `#c8aa6e` / `#785a28`; destacado `#f4d37c`; gradiente de títulos
  `linear-gradient(180deg,#fffae3,#eac269 48%,#8f6014 58%,#f4d37c)`.
- Cian `#0ac8b9` (activo / pasiva), `#7de9df` (texto sobre activo), `#c4d3df` (input),
  `#8b9ea8` / `#5e6b74` (secundario / terciario).
- Superficies `#0a0a0c`, `#12161a`, skeleton `#161a1e`, bordes `#23282d` / `#3e4b54`.
- Tipos: **Cinzel** (títulos y encabezados), **Times New Roman** (nombres), **Roboto** (UI).
- Chip paralelogramo `clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%)`;
  celda biselada `polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)`.

## Responsive
Breakpoints del proyecto: **1024px** (cae el panel lateral → barra superior, 5 columnas) y **480px**
(3 columnas, filtros plegables, controles a 44px). Entre 481 y 767px, 4 columnas con el layout móvil.

## Files
- `Vista Habilidades.dc.html` — prototipo de referencia con los tres tamaños + el modal.
