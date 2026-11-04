---
target: home
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\USUARIO\\Documents\\lol-wiki-frontend\\src\\app\\features\\home\\home.component.html"
target_fingerprint: "sha256:06b08bd0808572f3ffd51189fb635443b91ff9bf3eb17465e3feb686f6277ac8"
target_path: "C:\\Users\\USUARIO\\Documents\\lol-wiki-frontend\\src\\app\\features\\home\\home.component.html"
timestamp: 2026-11-04T15-26-22Z
slug: src-app-features-home-home-component-html
closed: true
---
Method: dual-agent (design-review sub-agent, detector sub-agent)

# Critique: Home page

Score 20/40 (Acceptable). Heuristics: 1=2, 2=3, 3=2, 4=2, 5=2, 6=3, 7=1, 8=2, 9=1, 10=2.

Design specificity: about 70% authored; hextech visual language is distinctive, but the hero reads as a splash screen and Times New Roman/bracketed labels drift from the system.

Detector: 1 template finding (broken-image, likely false positive); 7 browser findings (gradient text x3, glowing shadow x2, low contrast x1 likely false positive, wide letter spacing x1 false positive). Accessibility facts: html lang="en" on Spanish content, H2 before H1, no landmarks, unlabeled search input and button.

## Priority Issues
- [P0] Search is not keyboard- or screen-reader-operable (rows are unfocusable divs, no combobox/listbox semantics, no accessible names, wrong lang, no landmarks). Command: harden.
- [P1] Search is the product but not the focal point; ranking is substring-only, no autofocus, 2-char minimum with no hint, no empty state. Command: layout, then clarify.
- [P1] Mapas and Comunidad nav buttons and the hardcoded DESTACADO box look live but do nothing. Command: clarify, then harden.
- [P2] Typography drifts: Times New Roman hard-coded, three metallic gradient headlines, literal [BRACKETS] in nav labels. Command: typeset.
- [P2] Missing loading/empty/error states; five stacked nav buttons overflow an 844px viewport; placeholder truncates on mobile. Command: adapt, then harden.

## Persona red flags
Alex: no autofocus, no keyboard selection, weak ranking. Jordan: placeholder promises lore search, dead buttons look live. Sam: no accessible names, unfocusable results, invisible focus ring. Casey: Comunidad at/below fold, truncated placeholder.

## Questions
Why is the biggest type "LEAGUE of LEGENDS" and not the search? Is home a splash or a tool? Should unrouted controls be removed until real?
