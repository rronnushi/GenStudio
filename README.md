# RRON Generative Studio

A static generative-art gallery and studio. Open `index.html` in a modern
browser, or serve this directory with any static web server. No build step or
package installation is required to use the site. Google Fonts and Three.js load
from their existing CDNs.

## Source layout

- `index.html`: lightweight engine gallery and homepage.
- `studio.html`: the full generative editor.
- `assets/thumbnails`: static WebP examples used by the gallery.
- `css/home.css` and `js/home.js`: responsive gallery presentation and navigation.
- `css/studio.css`: the existing layout and visual styles.
- `js/core.js`: palettes, shared color/random/noise helpers, and WebGL rendering.
- `js/engines.js`: drawing engines and their parameter definitions.
- `js/catalog.js`: display names, descriptions, and explicit engine group order.
- `js/studio.js`: controls, render scheduling/composition, and PNG export.

The JavaScript files use classic scripts and share the same scope, in the order
shown above. This keeps direct `file://` opening supported. Add new drawing
engines to `ENGINES`; the engine selector and parameter controls are generated
from that registry.

Engine cards link to `studio.html?engine=...`, so direct links open the requested
engine and the editor keeps the URL synchronized when the selection changes.

Deploy both HTML files together with the `assets`, `css`, and `js` directories,
retaining their relative paths. Uploading only the HTML files is not sufficient.

## Regenerating thumbnails

Thumbnail generation is a development-only task. Install the dev dependency,
then run:

```sh
npm install
npm run thumbnails
```

Pass one or more engine IDs to regenerate only those images, for example
`npm run thumbnails -- hexCubes delaunay`. The script uses the real engine
renderers with stable seeds and stores 480×320 WebP files in
`assets/thumbnails`. If Three.js is unavailable, the Torus Knot thumbnail uses a
deterministic 2D fallback so generation can still finish offline.

## Checks

With Node.js installed:

```sh
node --test tests/regression.test.cjs
node --check js/core.js
node --check js/engines.js
node --check js/catalog.js
node --check js/home.js
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
