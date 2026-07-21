# Handoff: Detalle del campeón (modal)

## Overview
Vista de detalle de un campeón que se abre como **modal centrado** sobre la home cuando el
usuario selecciona un campeón en el buscador (`app-search-bar`). Muestra splash art, rol,
dificultad, estadísticas base y habilidades (pasiva + Q/W/E/R) con descripción interactiva.
Todos los datos provienen de **Data Dragon** (la misma API que ya usa `RiotDataService`).

## About the Design Files
El archivo `Detalle Campeon.dc.html` de este bundle es una **referencia de diseño hecha en
HTML** — un prototipo que muestra el aspecto y comportamiento deseados, **no** código para
copiar y pegar. La tarea es **recrear este diseño dentro del proyecto Angular existente**
(`lol-wiki-frontend`), respetando sus patrones: componentes standalone, SCSS por componente,
las variables CSS de `styles.scss` y el `RiotDataService` ya existente.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, clip-paths e interacciones son
finales. Recrear la UI pixel-perfect usando las variables y convenciones del proyecto.

## Arquitectura sugerida en Angular
1. **Nuevo componente** `features/champion-detail/champion-detail.component.ts` (standalone),
   que recibe un `@Input() championId: string` y renderiza el modal.
2. **Ampliar `RiotDataService`** con un método para el detalle por campeón (ver más abajo).
3. **`SearchBarComponent`**: al hacer clic en un `dropdown-item` de tipo `champion`, emitir
   un `@Output() championSelected = new EventEmitter<string>()` con el `id` del campeón
   (hoy el `SearchResult` no guarda el `id`; añádelo en `performSearch`).
4. **`HomeComponent`**: escuchar `(championSelected)` y renderizar
   `<app-champion-detail [championId]="selectedId" (close)="selectedId = null" *ngIf="selectedId">`.

## Screens / Views

### Modal de detalle del campeón
- **Purpose**: consultar de un vistazo rol, dificultad, stats base y habilidades del campeón.
- **Layout**: overlay a pantalla completa (`position:fixed; inset:0; z-index:200`), fondo
  `radial-gradient(circle, rgba(3,6,10,.72), rgba(2,3,5,.94))` + `backdrop-filter: blur(3px)`,
  centrado con flex. La tarjeta interior es `display:flex` (dos columnas), `max-width:1080px`,
  `height:min(680px,88vh)`, con un `clip-path` de esquinas biseladas a 28px:
  `polygon(28px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 28px), calc(100% - 28px) 100%, 28px 100%, 0 calc(100% - 28px), 0 28px)`.
  Borde `1px solid #785a28`, sombra `0 30px 80px rgba(0,0,0,.85)` + `inset 0 0 60px rgba(0,0,0,.6)`.

- **Columna izquierda — Splash (42%, min-width 340px)**:
  - `<img>` splash `object-fit:cover; object-position:32% center`, URL
    `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{id}_0.jpg` (sin versión).
  - Degradado encima: `linear-gradient(90deg, rgba(10,10,12,0) 55%, rgba(10,10,12,.95) 100%)`
    combinado con `linear-gradient(0deg, rgba(10,10,12,.96) 0%, rgba(10,10,12,0) 42%)`.
  - Abajo-izquierda: badge de **rol** (borde `1px solid #0ac8b9`, fondo `rgba(11,34,51,.55)`,
    texto `#0ac8b9`, `.68rem`, `700`, `letter-spacing:2px`, uppercase, clip-path paralelogramo),
    nombre del campeón en **Cinzel 700, 2.9rem** con gradiente dorado (ver Design Tokens), y
    título en **Times New Roman italic**, `#c8aa6e`, `1.05rem`.

- **Columna derecha — Contenido (flex:1)**:
  - **Barra superior** (padding `20px 26px 16px`, borde inferior `1px solid rgba(120,90,40,.35)`):
    icono cuadrado del campeón 44×44 (`cdn/{version}/img/champion/{id}.png`, borde `1px #c8aa6e`),
    nombre en **Cinzel 1.05rem**, sub-línea `Recurso · {partype}` en `#785a28` `.72rem` uppercase.
    A la derecha: bloque **Dificultad** = 3 “pips” de 22×5px (encendidos `#0ac8b9` con glow
    `0 0 6px rgba(10,200,185,.6)`, apagados `#2a2f33`; nº encendidos = `round(info.difficulty/3.34)`,
    mínimo 1) y botón de cierre ✕ 36×36 (gradiente `#3f4d58→#1e262c`, borde `1px #101518`,
    texto `#c8aa6e`, clip-path paralelogramo).
  - **Cuerpo scrollable** (`overflow-y:auto; padding:22px 26px 26px`):
    - **Estadísticas base**: encabezado de sección (Cinzel `.82rem`, `#c8aa6e`, `letter-spacing:3px`,
      uppercase + línea degradada). Grid `2 columnas`, `gap:11px 26px`. Cada stat: label
      (`#8b9ea8`, `.72rem`, uppercase) + valor (Times New Roman `.95rem` bold, `#f0e6d2`) y barra
      de 6px de alto (fondo `#1a1c1f`, borde `#262a2e`) con relleno
      `linear-gradient(90deg,#785a28,#c8aa6e)` cuyo ancho es `pct` (ver cálculo abajo).
      Stats: **Vida, Daño de ataque, Armadura, Resist. mágica, Vel. ataque, Vel. movimiento**.
    - **Habilidades**: encabezado de sección igual. Fila de 5 botones 56×56
      (borde `2px #785a28`; el **activo** cambia a `2px #0ac8b9`, `translateY(-3px)` y glow
      `0 0 14px rgba(10,200,185,.5)`). Cada botón lleva la imagen de la habilidad y un badge
      con la tecla (P/Q/W/E/R) abajo-derecha (`#0a0a0c`, borde `#785a28`, texto `#c8aa6e`).
    - **Detalle de la habilidad seleccionada**: panel con fondo
      `linear-gradient(180deg, rgba(23,75,110,.14), rgba(11,34,51,.06))`, borde `1px rgba(120,90,40,.4)`,
      **borde izquierdo `2px #0ac8b9`**, clip-path biselado a 12px. Contiene icono 42×42, badge de
      tecla (texto `#00c8ff`, borde `#174b6e`), nombre (Times New Roman `1.15rem` bold), meta
      (`Coste {costBurn} · Recarga {cooldownBurn}s`, o `Pasiva`/`Definitiva`) en `#785a28` uppercase,
      y descripción (`#b9b19d`, `.9rem`, `line-height:1.55`, `text-wrap:pretty`).

## Interactions & Behavior
- **Abrir**: clic en un resultado de campeón del dropdown del buscador → abre el modal con ese `id`.
- **Cerrar**: clic en el botón ✕ **o** clic en el backdrop (el contenido detiene la propagación
  con `stopPropagation`). Opcional: tecla `Esc`.
- **Seleccionar habilidad**: clic en un botón P/Q/W/E/R actualiza el panel de detalle; por
  defecto se muestra la **pasiva (P)**.
- **Animaciones**: backdrop `fadeIn .2s ease`; tarjeta `modalIn .3s cubic-bezier(.2,.8,.2,1)`
  (de `opacity:0; translateY(18px) scale(.985)` a normal). Transición del botón de habilidad
  `border-color .15s, transform .15s`.
- **Loading**: usar los datos ya cacheados si existen; mientras llega la respuesta puede
  mostrarse un estado vacío/esqueleto (el prototipo usa Aatrox como fallback para pintar al
  instante — en Angular basta con `*ngIf="champion$ | async as champion"` o un skeleton).
- **Error de red**: si falla el fetch, no romper la UI (en el prototipo conserva el fallback).

## State Management
- `championId: string` (input del componente).
- `selectedAbility: 'P'|'Q'|'W'|'E'|'R'` (por defecto `'P'`).
- Datos del campeón: `Observable<ChampionDetail>` desde el servicio (ver abajo).
- En `HomeComponent`: `selectedChampionId: string | null` para montar/desmontar el modal.

## Ampliación de RiotDataService (data fetching)
El `RiotDataService` actual sólo trae el catálogo resumido (`champion.json`). El detalle
(stats + habilidades) está en el endpoint **por campeón**:

```
GET https://ddragon.leagueoflegends.com/cdn/{version}/data/es_ES/champion/{id}.json
→ data[id] = { name, title, tags[], partype, info:{difficulty}, stats{}, passive{}, spells[] }
```

Método sugerido:

```ts
getChampionDetail(id: string): Observable<any> {
  return this.getLatestVersion().pipe(
    switchMap(v => this.http.get<any>(
      `${this.baseUrl}/cdn/${v}/data/es_ES/champion/${id}.json`
    ).pipe(map(res => res.data[id])))
  );
}
```

**Mapeo de datos** (tal cual el prototipo):
- **Rol** (badge): `tags[]` traducidos → `{Fighter:'Luchador', Tank:'Tanque', Mage:'Mago',
  Assassin:'Asesino', Marksman:'Tirador', Support:'Soporte'}`, unidos con ` · `.
- **Recurso**: `partype` (p. ej. “Pozo de Sangre”).
- **Dificultad**: `info.difficulty` (0–10) → pips = `Math.max(1, Math.min(3, Math.round(difficulty/3.34)))`.
- **Stats** desde `stats{}`:
  - Vida = `hp`, Daño = `attackdamage`, Armadura = `armor`, Resist. mágica = `spellblock`,
    Vel. movimiento = `movespeed` (todo `Math.round`).
  - **Vel. ataque** = `stats.attackspeed` si existe; si no, `0.625 / (1 + attackspeedoffset)`.
    Mostrar con `toFixed(3)`.
  - **Ancho de barra** `pct = clamp(6..100, round(valor/max*100))` con maxes:
    `{hp:1100, attackdamage:75, armor:50, spellblock:40, attackspeed:1.0, movespeed:400}`.
- **Habilidades**:
  - Pasiva: `passive.name`, icono `cdn/{v}/img/passive/{passive.image.full}`, meta `Pasiva`,
    descripción `passive.description`.
  - Q/W/E/R: `spells[0..3]` → `name`, icono `cdn/{v}/img/spell/{spell.image.full}`,
    meta `Coste {costBurn} · Recarga {cooldownBurn}s` (omite el coste si es `'0'`),
    descripción `spell.description`.
  - **Importante**: `description`/`passive.description` contienen HTML — límpialo con
    `.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()` (o un `DomSanitizer`/pipe) antes de mostrar.

## Design Tokens
Reutiliza las variables ya definidas en `styles.scss` (`--color-gold-*`, `--color-blue-glow`,
`--color-bg-dark`, `--font-title` Cinzel, `--font-body` Roboto). Valores concretos usados:

- **Oro**: `#f0e6d2` (claro), `#c8aa6e` (base), `#785a28` (oscuro), `#e5cd8d`.
- **Azul/cian**: `#0ac8b9`, `#00c8ff`, `#174b6e`, `#0b2233`.
- **Neutros/paneles**: `#0a0a0c`, `#12100b`, `#15181a`, `#1a1c1f`, `#262a2e`, `#2a2f33`,
  `#8b9ea8` (texto secundario), `#b9b19d` (cuerpo).
- **Gradiente dorado de títulos** (Cinzel/Times):
  `linear-gradient(180deg,#fffae3 0%,#eac269 48%,#8f6014 58%,#f4d37c 100%)` con
  `-webkit-background-clip:text; -webkit-text-fill-color:transparent` +
  `filter: drop-shadow(0 2px 2px #050402)`.
- **Tipografía**: títulos **Cinzel** 700; subtítulos/valores **Times New Roman**;
  cuerpo/labels **Roboto**. Tamaños: nombre 2.9rem, título 1.05rem, encabezados de sección
  .82rem (`letter-spacing:3px`), labels .72rem, cuerpo .9rem.
- **Border radius**: prácticamente 0 — el estilo usa **clip-paths** biselados (28px tarjeta,
  12px paneles, paralelogramos en badges/botones), no esquinas redondeadas.
- **Sombras**: tarjeta `0 30px 80px rgba(0,0,0,.85)`; glow cian `0 0 14px rgba(10,200,185,.5)`.

## Assets
- **Splash**: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{id}_0.jpg`.
- **Icono cuadrado**: `.../cdn/{version}/img/champion/{id}.png`.
- **Iconos de habilidad**: `.../cdn/{version}/img/spell/{file}` y `.../img/passive/{file}`.
- **Fondo de la home** (`public/background.jpg`): ya existe en el proyecto.
Todas se cargan por URL desde el CDN — no hay que empaquetar imágenes.

## Files
- `Detalle Campeon.dc.html` — prototipo de referencia (incluye también la home + buscador
  recreados para dar contexto; en el proyecto sólo hay que implementar el **modal** y el
  cableado en `SearchBarComponent`/`HomeComponent`).

## Responsive
Prototipo pensado para desktop. En móvil: apilar las dos columnas (splash arriba, contenido
abajo), grid de stats a 1 columna, y reducir el `max-width`/`height` del modal a márgenes de
la pantalla. Seguir los breakpoints ya usados en el proyecto (`768px`, `480px`).
