# mapbox-gl-draw-rectangle-validation-mode

[mapbox-gl](https://github.com/mapbox/mapbox-gl-draw) Draw rectangle mode, with feature validation

## [DEMO](https://dqunbp.github.io/mapbox-gl-draw-rectangle-validation-mode/)

[![NPM](https://img.shields.io/npm/v/mapbox-gl-draw-rectangle-validation-mode.svg)](https://www.npmjs.com/package/mapbox-gl-draw-rectangle-validation-mode)

## Features

- One/two click drawing
- Mobile compabillity
- Feature validation callback **Optional**

## Install

```bash
npm install --save @mapbox/mapbox-gl-draw mapbox-gl-draw-rectangle-validation-mode
```

## Usage

```js
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle, {
  DrawStyles,
} from "mapbox-gl-draw-rectangle-validation-mode";

const map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-91.874, 42.76], // starting position
  zoom: 12, // starting zoom
});

const draw = new MapboxDraw({
  userProperties: true,
  displayControlsDefault: false,
  styles: DrawStyles,
  modes: Object.assign(MapboxDraw.modes, {
    draw_rectangle: DrawRectangle,
  }),
});
map.addControl(draw);

// when mode drawing should be activated
draw.changeMode("draw_rectangle", {
  inspect: (rectangle) => ({ valid: true, anyOtherProps: "foo" }), // optional
  onInvalid: ({ anyOtherProps }) => console.log("invalid!", anyOtherProps), // optional
  allowCreateInvalid: false, // default false
  callInvalidOnce: true, // default false
  stopOnEscape: true, // default true
});
```

## Styles

### Invalid features

Invalid feature has `user_is_invalid: true` property

### Default styles

`mapbox-gl-draw-rectangle-validation-mode` use [default mapbox-gl-draw styles](https://github.com/mapbox/mapbox-gl-draw/blob/master/src/lib/theme.js) with 2 overrided layers:

```js
[
  {
    id: "gl-draw-polygon-fill-active",
    type: "fill",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": [
        "case",
        ["!", ["to-boolean", ["get", "user_is_invalid"]]], // turns to red if feature has `user_is_invalid: true` prop
        "#fbb03b",
        "#ff0000",
      ],
      "fill-opacity": 0.2,
    },
  },
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "case",
        ["!", ["to-boolean", ["get", "user_is_invalid"]]],
        "#fbb03b",
        "#ff0000",
      ],
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
];
```

You also can export it

```js
import { ActivePolygonStyles } from "mapbox-gl-draw-rectangle-validation-mode";
```

### Override styles

You can override default drawing styles with `overrideDefaultStyles` helper function

```js
import { overrideDefaultStyles } from "mapbox-gl-draw-rectangle-validation-mode";

const drawStyles = overrideDefaultStyles(<your_custom_styles>);
```

Default styles with same ids will be replaced.

## [Example](https://github.com/dqunbp/mapbox-gl-draw-rectangle-validation-mode/blob/master/example/index.js)

## License

MIT © [dqunbp](LICENSE)
