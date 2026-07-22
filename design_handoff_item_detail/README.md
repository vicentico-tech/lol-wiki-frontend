# Handoff: Detalle del objeto (modal)

## Overview
Vista de detalle de un **objeto** que se abre como modal centrado sobre la home, mutuamente
excluyente con el modal de campeón ya implementado (mismo overlay, mismo patrón de apertura/
cierre). Se dispara al seleccionar un resultado de tipo "objeto" en el buscador (`app-search-bar`).
Muestra icono, nombre, tags, precio, estadísticas, descripción y árbol de recetas
(compuesto por / se combina en). Datos desde **Data Dragon**.

## About the Design Files
El archivo `Detalle Campeon.dc.html` de este bundle contiene **ambos modales** (campeón y
objeto) en un mismo prototipo HTML de referencia — **no** es código para copiar y pegar. La
tarea es recrear el **modal de objeto** dentro del proyecto Angular existente
(`lol-wiki-frontend`), como componente hermano del modal de campeón ya entregado.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, clip-paths e interacciones son
finales.

## Arquitectura sugerida en Angular
1. **Nuevo componente** `features/item-detail/item-detail.component.ts` (standalone), con
   `@Input() itemId: string`, hermano de `champion-detail.component.ts`.
2. **Ampliar `RiotDataService`** con `getItemDetail(id)` (ver más abajo). Si el catálogo de
   objetos completo ya se cachea en memoria (p. ej. para resolver "Compuesto por"/"Se combina
   en"), exponer también un `getItemCatalog()` que devuelva `item.json` completo una sola vez.
3. **`SearchBarComponent`**: el `SearchResult` necesita distinguir el tipo de resultado
   (`'champion' | 'item'`) y su `id`. Al hacer clic en un `dropdown-item` de tipo `item`,
   emitir `@Output() itemSelected = new EventEmitter<string>()`.
4. **`HomeComponent`**: mantener **un solo** estado de selección mutuamente excluyente, p. ej.
   `selected: { type: 'champion'|'item', id: string } | null`, y renderizar
   `<app-champion-detail *ngIf="selected?.type === 'champion'" [championId]="selected.id" (close)="selected = null">`
   /
   `<app-item-detail *ngIf="selected?.type === 'item'" [itemId]="selected.id" (close)="selected = null">`.
   Abrir uno cierra automáticamente el otro (un solo campo de estado, no dos booleans).

## Screens / Views

### Modal de detalle del objeto
- **Purpose**: consultar de un vistazo tags, precio, estadísticas, efectos y receta de un objeto.
- **Layout**: mismo overlay que el modal de campeón (`position:fixed; inset:0; z-index:200`,
  fondo `radial-gradient(circle,rgba(3,6,10,.72),rgba(2,3,5,.94))` + `backdrop-filter:blur(3px)`,
  centrado con flex). La tarjeta es **una sola columna vertical** (a diferencia del modal de
  campeón, que es de dos columnas), `max-width:620px`, `max-height:88vh`, `display:flex;
  flex-direction:column`, clip-path de esquinas biseladas a **20px**:
  `polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)`.
  Borde `1px solid #785a28`, misma sombra que el modal de campeón.

- **Cabecera** (padding `26px 26px 18px`, borde inferior `1px solid rgba(120,90,40,.35)`,
  `display:flex; align-items:flex-start; gap:18px`):
  - Icono 88×88 en marco hexagonal biselado (14px), borde `2px #c8aa6e` + doble contorno
    (`box-shadow: 0 0 0 4px #0a0a0c, 0 0 0 5px #785a28`), fondo `#000`.
  - Nombre en **Cinzel 700, 1.7rem** con el mismo gradiente dorado de títulos.
  - Fila de **tags** (chips): borde `1px #0ac8b9`, fondo `rgba(11,34,51,.55)`, texto `#0ac8b9`
    `.62rem` `700` uppercase, clip-path paralelogramo — mismo tratamiento que el badge de rol
    del campeón pero en tamaño chip.
  - Precio: bolita dorada (`radial-gradient(circle at 35% 30%,#f4d37c,#a27533 70%)`) + oro
    total en Times New Roman bold `1.05rem` `#f0e6d2`, y "Venta {precio} PO" en `#785a28` `.78rem`.
  - Botón de cierre ✕ 36×36, idéntico al del modal de campeón.

- **Cuerpo scrollable** (`padding:20px 26px 26px`), en orden:
  1. **Estadísticas** (sólo si el objeto tiene stats planos): encabezado de sección (Cinzel
     `.78rem`, `#c8aa6e`, `letter-spacing:3px`, uppercase + línea degradada), grid 2 columnas,
     cada fila = punto cian `5×5px` (glow) + `<b>+valor</b> etiqueta` en `#c4d3df` `.88rem`.
  2. **Descripción**: mismo panel que la habilidad seleccionada del campeón — fondo
     `linear-gradient(180deg,rgba(23,75,110,.14),rgba(11,34,51,.06))`, borde
     `1px rgba(120,90,40,.4)`, **borde izquierdo `2px #0ac8b9`**, clip-path biselado a 10px,
     texto `#b9b19d` `.9rem` `line-height:1.55`. El HTML de `description` se limpia quitando
     el bloque `<stats>…</stats>` (ya mostrado arriba) antes de despojar el resto de tags.
  3. **Compuesto por** (si `from.length`): fila de items componente, cada uno = icono 48×48
     (borde `1px #785a28`, fondo `#000`) + nombre debajo (`#8b9ea8` `.62rem`, centrado,
     `line-height:1.2`), en columna flex `width:64px`.
  4. **Se combina en** (si `into.length`): mismo tratamiento visual que "Compuesto por".

## Interactions & Behavior
- **Abrir**: clic en un resultado de objeto del dropdown del buscador → abre el modal con ese `id`
  y cierra el de campeón si estaba abierto (estado mutuamente excluyente, ver arriba).
- **Cerrar**: clic en ✕ o en el backdrop (`stopPropagation` en el contenido). Opcional `Esc`.
- **Sin selector de sub-elemento**: a diferencia del campeón (que tiene P/Q/W/E/R), el objeto
  no tiene tabs — todo el contenido es un único scroll.
- **Animaciones**: iguales al modal de campeón (`fadeIn .2s`, `modalIn .3s cubic-bezier(.2,.8,.2,1)`).
- **Loading**: el prototipo usa **Fuerza de la Trinidad (id 3078)** como fallback visual para
  pintar al instante; en Angular basta `*ngIf="item$ | async as item"` o un skeleton.
- **Error de red**: si falla el fetch, conservar el fallback / no romper la UI.

## State Management
- `itemId: string` (input del componente).
- Datos del objeto: `Observable<ItemDetail>` desde el servicio.
- En `HomeComponent`: el mismo campo de selección mutuamente excluyente descrito arriba
  (no un booleano independiente por modal).

## Ampliación de RiotDataService (data fetching)

```
GET https://ddragon.leagueoflegends.com/cdn/{version}/data/es_ES/item.json
→ data[id] = { name, description, tags[], gold:{total,sell}, stats{}, from[], into[] }
```

Método sugerido:

```ts
getItemDetail(id: string): Observable<any> {
  return this.getLatestVersion().pipe(
    switchMap(v => this.http.get<any>(
      `${this.baseUrl}/cdn/${v}/data/es_ES/item.json`
    ).pipe(map(res => ({ version: v, all: res.data, item: res.data[id] }))))
  );
}
```
Nota: `item.json` trae **todos** los objetos en una sola llamada — consérvalo cacheado (`all`)
para resolver los nombres/iconos de `from`/`into` sin llamadas adicionales.

**Mapeo de datos** (tal cual el prototipo):
- **Tags** (máx. 4 mostrados): traducir con el mismo patrón que roles de campeón, p. ej.
  `{Damage:'Daño', SpellDamage:'Poder de habilidad', Health:'Vida', AttackSpeed:'Vel. de ataque',
  Armor:'Armadura', SpellBlock:'Resist. mágica', Boots:'Botas', CriticalStrike:'Golpe crítico', …}`;
  si no hay traducción, separar camelCase (`t.replace(/([a-z])([A-Z])/g,'$1 $2')`).
- **Precio**: `gold.total` (oro total) y `gold.sell` (venta), formateados como `"{n} PO"`.
- **Estadísticas** desde `stats{}` — sólo mostrar claves con valor truthy. Mapeo de claves
  Data Dragon → etiqueta ES: `FlatHPPoolMod→vida, FlatMPPoolMod→maná,
  FlatPhysicalDamageMod→daño de ataque, FlatMagicDamageMod→poder de habilidad,
  FlatArmorMod→armadura, FlatSpellBlockMod→resistencia mágica, FlatCritChanceMod→prob. de
  golpe crítico, FlatHPRegenMod→regen. de vida, FlatMPRegenMod→regen. de maná,
  PercentAttackSpeedMod→velocidad de ataque, FlatMovementSpeedMod/PercentMovementSpeedMod→
  velocidad de movimiento, PercentLifeStealMod→robo de vida`. Las claves `Percent*` y
  `FlatCritChanceMod` se muestran como `%` (`Math.round(v*100)+'%'`); el resto como entero o
  `toFixed(1)`, siempre con signo `+` delante.
- **Descripción**: `description` trae HTML, incluyendo a veces un bloque `<stats>…</stats>`
  redundante con las estadísticas ya listadas arriba — **eliminarlo** con
  `.replace(/<stats>[\s\S]*?<\/stats>/gi,'')` antes de despojar el resto de tags con
  `.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()`.
- **Compuesto por / Se combina en**: `from[]`/`into[]` son arrays de **ids** de objeto (string).
  Resolver `name` e `icon` contra el catálogo completo (`all[id].name`,
  `cdn/{version}/img/item/{id}.png`). Si un id no está en el catálogo, usar el id como nombre.
  Ocultar la sección entera si el array está vacío.

## Design Tokens
Mismos tokens que el modal de campeón (ver handoff `champion-detail`) — reutilizar
`--color-gold-*`, `--color-blue-glow`, Cinzel/Times/Roboto. Diferencias puntuales de este modal:
- Modal de una sola columna, `max-width:620px` (vs. 1080px del de campeón).
- Clip-path de tarjeta a **20px** (vs. 28px del de campeón).
- Chips de tag más pequeños que el badge de rol del campeón, pero mismo estilo visual
  (paralelogramo cian).
- Punto de estadística: `5×5px` cian con glow, en vez de la barra de progreso del campeón
  (los stats de objeto son incrementales `+valor`, no tienen "máximo" con el que barrear).

## Assets
- **Icono de objeto**: `.../cdn/{version}/img/item/{id}.png` (cuadrado, sin splash — a
  diferencia del campeón, los objetos no tienen imagen grande).
- Todas las imágenes se cargan por URL desde el CDN.
- **Importante — guards de `src`**: no renderizar ningún `<img>` (icono de objeto, iconos de
  `from`/`into`) hasta que la URL exista (`*ngIf="iconUrl"` o equivalente), igual que en el
  prototipo — evita 404s en consola mientras llega la respuesta del servicio.

## Files
- `Detalle Campeon.dc.html` — prototipo de referencia (incluye home + buscador + **ambos**
  modales, campeón y objeto, para dar contexto de la exclusión mutua). En el proyecto sólo
  hay que implementar el **modal de objeto** y el cableado de tipo de resultado en
  `SearchBarComponent`/`HomeComponent`.

## Responsive
Prototipo pensado para desktop. En móvil: reducir `max-width` a márgenes de pantalla, grid de
estadísticas a 1 columna, y permitir que la fila de "Compuesto por"/"Se combina en" haga wrap
(ya usa `flex-wrap:wrap`, así que sólo revisar el ancho de cada item en pantallas muy pequeñas).
Seguir los breakpoints ya usados en el proyecto (`768px`, `480px`).
