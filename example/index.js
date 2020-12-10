import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle, {
  DrawStyles,
} from "mapbox-gl-draw-rectangle-validation-mode";

import area from "@turf/area";

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "osm",
      source: "osm",
      type: "raster",
    },
  ],
};

const map = new mapboxgl.Map({
  container: "map", // container id
  style: OSM_STYLE,
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

const currenArea = document.getElementById("area");
currenArea.textContent = "0";

function onAreaChanged(area) {
  currenArea.textContent = `${(area / 1_000_000).toFixed(2)}`;
}

document.getElementById("draw-rectangle").addEventListener("click", () => {
  console.log("let's draw!");
  draw.changeMode("draw_rectangle", {
    inspect: (rectangle) => {
      const a = area(rectangle);
      return { valid: a < 5 * 1_000_000, area: a };
    },
    allowCreateInvalid: false, // default false
    callInvalidOnce: false, // default false - calls exceedCallback on each mouse move
    onInvalid: ({ area }) => console.log(`area exceeded! ${area}`), // optional
    stopOnEscape: true, // default true
  });
});
