# Design system — educational laboratory

**Scene:** A person reads on a phone in a lit auditorium; the same content must remain legible on a projected screen. The interface behaves like a calm, working exhibit, not a terminal mockup or a dashboard.

**Visual direction:** A pale green laboratory ground, warm off-white reading surfaces, dark forest ink and one family accent per concept group: green for fundamentals, rust for action, blue for organization, amber for control. Accents always accompany text labels rather than replacing them.

**Typography:** System sans for body and display to keep the static site usable without downloading fonts. Large, compact display headings contrast with short explanations and spacious line height. Code-like labels appear only for commands and trace actions.

**Components:** Buttons with clear states and 44px minimum touch height; selectable text rows in the atlas; an explanatory output area for each microinteraction; configuration switches with native checkbox semantics; linear trace events with input, action, result and stop/continue reason; a node map with labeled connection controls and an accessible list equivalent.

**Motion:** The introductory comparison has a short content transition; the map animates only on request. Reduced-motion preferences disable transitions and animations. No important information depends on hover or animation.

**Responsive behavior:** Desktop uses two-column explanation and execution workspaces; phone stacks them vertically. The concept families remain directly selectable. Presentation mode enlarges explanatory text and hides secondary metadata without removing functional controls.
