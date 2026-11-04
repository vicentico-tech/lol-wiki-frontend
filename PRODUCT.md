# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Spanish-speaking League of Legends players looking things up quickly, often mid-game or between games: a champion's stats, an item's build path, what an ability does. Lore readers and casual fans are a secondary audience; quick reference comes first.

## Product Purpose

A wiki for League of Legends ("El wiki de la comunidad"). It lets a player search or browse champions, items and abilities and get the answer fast. Success is the player finding the fact they need within a few seconds and going back to the game.

## Positioning

A fast, clean browser for Riot's own game data. It doesn't carry the ads and clutter of ad-supported wikis, and it is Spanish-first.

## Operating Context

- Angular 20 SPA (standalone components, signals), Karma/Jasmine tests, built with Angular CLI.
- Routes: home (search bar plus navigation), `/campeones`, `/objetos`, `/habilidades`. Champion and item detail open as modals from search.
- Content comes from Riot's static data (Data Dragon); typed in `src/app/interfaces/riot-data.interface.ts`.
- Design handoff specs for each list and detail view live in `design_handoff_*` folders at the repo root.
- Google Tag Manager analytics are injected in production builds only.

## Capabilities and Constraints

- All user-facing copy is Spanish.
- Content is Riot's data, not authored in this project.
- This is a fan project and is not affiliated with or endorsed by Riot Games. It needs Riot's legal disclaimer and must not imply endorsement.
- "Mapas" and "Comunidad" appear in the home navigation but have no routes yet. They are planned features, not abandoned placeholders.
- The "DESTACADO" featured box on home is currently hardcoded (Aatrox biography).

## Brand Commitments

Home uses League of Legends naming ("LEAGUE of LEGENDS", "EL WIKI DE LA COMUNIDAD"). No separate project brand, logo or voice guide has been confirmed.

## Evidence on Hand

- Design handoff docs: `design_handoff_champion_list/`, `design_handoff_champion_detail/`, `design_handoff_item_list/`, `design_handoff_item_detail/`, `design_handoff_ability_list/`.
- No user testimonials, usage metrics or community content exist. Don't invent them.

## Product Principles

1. Lookup speed beats browsing delight: the answer should be reachable in seconds from the home search.
2. Show Riot's data faithfully and clearly; never imply the project or its data is official.
3. Spanish first, in every label, empty state and error message.
4. Planned sections (Mapas, Comunidad) should look like what they are, not like broken links.

## Accessibility & Inclusion

No specific standard has been set. Treat keyboard and screen-reader use of search, modals and filters as baseline expectations.
