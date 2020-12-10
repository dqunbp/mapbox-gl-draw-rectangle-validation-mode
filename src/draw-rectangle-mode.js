import { Constants, CommonSelectors, createVertex } from "./lib";

import { getIneractionSwitch } from "./switchIteractions";

const doubleClickZoom = getIneractionSwitch("doubleClickZoom");
const dragPan = getIneractionSwitch("dragPan");

const DrawRectangle = {};

DrawRectangle.onSetup = function ({
  inspect,
  onInvalid,
  callInvalidOnce = false,
  allowCreateInvalid = false,
  stopOnEscape = true,
}) {
  const rectangle = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]],
    },
  });
  this.addFeature(rectangle);

  this.clearSelectedFeatures();

  // Disable iteractions
  doubleClickZoom.disable(this);
  dragPan.disable(this);

  // Update cursor
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({ trash: true });

  // Setup mode options
  if (inspect) this.inspect = inspect;
  this.allowCreateInvalid = allowCreateInvalid;
  this.callInvalidOnce = callInvalidOnce;
  this.stopOnEscape = stopOnEscape;
  if (onInvalid) this.onInvalid = onInvalid;

  return {
    rectangle,
    dragMoving: false,
    isRectangleInvalid: false,
  };
};

DrawRectangle.onClick = function (state, e) {
  // on first click, save clicked point coords as starting for rectangle
  if (!state.startPoint) {
    const startPoint = [e.lngLat.lng, e.lngLat.lat];
    state.startPoint = startPoint;
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.rectangle.updateCoordinate(`0.0`, e.lngLat.lng, e.lngLat.lat);
    state.rectangle.updateCoordinate(`0.1`, e.lngLat.lng, e.lngLat.lat);
  } else if (
    state.startPoint &&
    state.startPoint[0] !== e.lngLat.lng &&
    state.startPoint[1] !== e.lngLat.lat &&
    state.dragMoving &&
    (!state.isRectangleInvalid || this.allowCreateInvalid)
  ) {
    this.updateUIClasses({ mouse: "pointer" });
    state.endPoint = [e.lngLat.lng, e.lngLat.lat];
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.rectangle.id],
    });
  }
};

DrawRectangle.onMouseUp = DrawRectangle.onClick;
DrawRectangle.onMouseDown = DrawRectangle.onClick;
DrawRectangle.onTouchStart = DrawRectangle.onClick;
DrawRectangle.onTouchEnd = function (state, e) {
  if (
    state.startPoint &&
    state.startPoint[0] !== e.lngLat.lng &&
    state.startPoint[1] !== e.lngLat.lat
  ) {
    DrawRectangle.onMouseMove(state, e);
    this.updateUIClasses({ mouse: "pointer" });
    state.endPoint = [e.lngLat.lng, e.lngLat.lat];
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.rectangle.id],
    });
  } else DrawRectangle.onClick(state, e);
};

DrawRectangle.onTap = function (state, e) {
  if (!state.startPoint) this.onClick(state, e);
};

DrawRectangle.onMouseMove = function (state, e) {
  state.dragMoving = true;
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({ mouse: Constants.cursors.POINTER });
  }
  if (state.startPoint) {
    state.rectangle.updateCoordinate("0.1", e.lngLat.lng, state.startPoint[1]); // maxX, minY
    state.rectangle.updateCoordinate("0.2", e.lngLat.lng, e.lngLat.lat); // maxX, maxY
    state.rectangle.updateCoordinate("0.3", state.startPoint[0], e.lngLat.lat); // minX,maxY
    state.rectangle.updateCoordinate(
      "0.4",
      state.startPoint[0],
      state.startPoint[1]
    );
  } else {
    state.rectangle.updateCoordinate(`0.0`, e.lngLat.lng, e.lngLat.lat);
  }

  if (this.inspect) {
    const { valid, ...data } = this.inspect(state.rectangle) || {};

    if (!valid) {
      if (!state.isRectangleInvalid || !this.callInvalidOnce)
        if (this.onInvalid) this.onInvalid(data);
      state.isRectangleInvalid = true;
      state.rectangle.properties.is_invalid = true;
    } else {
      state.isRectangleInvalid = false;
      state.rectangle.properties.is_invalid = false;
    }
  }
};
DrawRectangle.onDrag = DrawRectangle.onMouseMove;
DrawRectangle.onTouchMove = DrawRectangle.onMouseMove;

DrawRectangle.onStop = function (state) {
  this.updateUIClasses({ mouse: Constants.cursors.NONE });

  // Enable iteractions
  doubleClickZoom.enable(this);
  dragPan.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.rectangle.id) === undefined) return;

  //remove last added coordinate
  state.rectangle.removeCoordinate("0.5");
  if (state.rectangle.isValid()) {
    this.map.fire(Constants.events.CREATE, {
      features: [state.rectangle.toGeoJSON()],
    });
  } else {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawRectangle.onKeyUp = function (state, e) {
  if (CommonSelectors.isEscapeKey(e))
    if (this.stopOnEscape) {
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    } else if (CommonSelectors.isEnterKey(e)) {
      this.changeMode(Constants.modes.SIMPLE_SELECT, {
        featureIds: [state.rectangle.id],
      });
    }
};

DrawRectangle.onTrash = function (state) {
  this.deleteFeature([state.rectangle.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawRectangle.toDisplayFeatures = function (state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.rectangle.id;
  geojson.properties.active = isActivePolygon
    ? Constants.activeStates.ACTIVE
    : Constants.activeStates.INACTIVE;
  if (!isActivePolygon) return display(geojson);

  if (geojson.geometry.coordinates.length === 0) return;
  const coordinateCount = geojson.geometry.coordinates[0].length;

  if (coordinateCount < 3) return;
  display(
    createVertex(
      state.rectangle.id,
      geojson.geometry.coordinates[0][0],
      "0.0",
      false
    )
  );
  geojson.properties.meta = Constants.meta.FEATURE;

  if (!state.startPoint) return;
  return display(geojson);
};

export default DrawRectangle;
