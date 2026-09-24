# RRON Generative Studio

A static generative-art studio. https://rronnushi.github.io/GenStudio/

Open `index.html` in a modern browser, or serve
this directory with any static web server. No build step or package installation
is required. Google Fonts and Three.js load from their existing CDNs.

## Source layout

- `index.html`: page markup and script loading order.
- `css/studio.css`: the existing layout and visual styles.
- `js/core.js`: palettes, shared color/random/noise helpers, and WebGL rendering.
- `js/engines.js`: drawing engines and their parameter definitions.
- `js/catalog.js`: display names and the explicit engine group order.
- `js/studio.js`: controls, render scheduling/composition, and PNG export.

The JavaScript files use classic scripts and share the same scope, in the order
shown above. This keeps direct `file://` opening supported. Add new drawing
engines to `ENGINES`; the engine selector and parameter controls are generated
from that registry.

Deploy `index.html` together with the `css` and `js` directories, retaining their
relative paths. Uploading only the HTML file is no longer sufficient.

## Checks

With Node.js installed:

```sh
node --test tests/regression.test.cjs
node --check js/core.js
node --check js/engines.js
node --check js/catalog.js
node --check js/studio.js
```

Regression coverage includes hue wrapping, seeded random repeatability, render
queue recovery after an exception, and WebGL resource cleanup on both success
and failure.

## Refactor scope

Drawing algorithms were extracted without changes. The focused fixes
normalize negative palette hues, allow another render after a drawing error,
and release shader objects while reporting shader compilation/link errors.
Hovered palette swatches also stack above neighboring color inputs so their
delete buttons receive clicks.
Repeated global-control event binding is consolidated in one place.

Existing rendering behavior remains: grain uses unseeded randomness, and a 2x
export re-renders at larger dimensions rather than scaling a preview snapshot.
