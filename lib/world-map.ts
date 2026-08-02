/**
 * The world map's frame and its projection.
 *
 * The coastline itself lives in `world-map-data.ts`, generated from Natural
 * Earth by `scripts/generate-world-map.mjs`. That path is pre-projected into
 * exactly the coordinate space `project()` produces below, so the land and the
 * region markers stay registered with each other — which means the bounds here
 * and the ones in the generator have to agree.
 */

/**
 * Where the equirectangular map's edges sit, in degrees.
 *
 * Cropped to the inhabited band rather than to the whole globe. Every region on
 * the map sits between 34°S (Sydney) and 60°N (Stockholm), so the bounds leave a
 * margin either side of that and no more — running to the poles spent a fifth of
 * the frame's height on empty ocean and squeezed the markers together.
 *
 * Antarctica and the high Arctic are in the source topology but fall outside
 * these lines and are clipped away by the viewBox.
 */
export const MAP_BOUNDS = { lonMin: -180, lonMax: 180, latMin: -48, latMax: 76 };

/** viewBox dimensions — one unit per degree, so nothing is stretched. */
export const MAP_SIZE = {
  width: MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin,
  height: MAP_BOUNDS.latMax - MAP_BOUNDS.latMin,
};

/**
 * Longitude/latitude to viewBox coordinates.
 *
 * Plate carrée — longitude and latitude scale linearly. It distorts area near
 * the poles, but it keeps the maths trivial and the markers land where a reader
 * expects; a proper projection would be a runtime dependency for no gain at
 * this size. This is the same projection the generator applies to the land, at
 * the same scale.
 */
export function project(lon: number, lat: number): { x: number; y: number } {
  const { lonMin, lonMax, latMin, latMax } = MAP_BOUNDS;
  return {
    x: ((lon - lonMin) / (lonMax - lonMin)) * MAP_SIZE.width,
    y: ((latMax - lat) / (latMax - latMin)) * MAP_SIZE.height,
  };
}
