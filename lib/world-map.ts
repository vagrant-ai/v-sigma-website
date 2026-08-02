/**
 * A simplified world coastline, as SVG paths in equirectangular space.
 *
 * Coordinates are raw lon/lat. The viewBox spans one unit per degree (see
 * `MAP_SIZE` and the assertion in regions.test.ts), so the component places
 * these with a single flip-and-shift group transform rather than projecting
 * every point — landmasses and region markers then share one coordinate system
 * and stay registered with each other.
 *
 * Coarse but recognisable: every continent's characteristic features are kept
 * (the Gulf of Guinea, the Bay of Bengal, the Cape, Kamchatka, Baja) because
 * without them the outlines read as blobs and the markers lose their anchor.
 * Hand-written rather than pulled from GeoJSON so the site doesn't ship a
 * topology file and a projection library for a backdrop behind 17 dots.
 *
 * Antarctica is omitted — no GPU capacity there, and it would eat the bottom of
 * the frame.
 */
export const LANDMASSES: string[] = [
  // North America — Alaska, the Arctic coast, Hudson Bay, the eastern seaboard,
  // the Gulf, Mexico, and back up the Pacific coast.
  "M -166 54 L -163 60 L -166 65 L -156 71 L -140 70 L -128 70 L -115 73 L -100 74 L -95 68 L -92 57 L -79 62 L -78 52 L -68 60 L -60 55 L -53 47 L -66 44 L -70 41 L -74 35 L -81 31 L -80 25 L -83 29 L -90 29 L -97 26 L -97 20 L -105 19 L -105 22 L -110 24 L -113 31 L -114 27 L -110 23 L -117 32 L -121 35 L -124 40 L -124 46 L -123 49 L -131 54 L -136 58 L -145 60 L -152 58 L -158 56 Z",
  // Greenland
  "M -45 83 L -25 78 L -22 70 L -32 64 L -43 60 L -50 62 L -55 66 L -62 72 L -58 79 Z",
  // South America — the Ecuadorian bulge west, the Brazilian bulge east, and the
  // taper to Tierra del Fuego.
  "M -78 8 L -72 12 L -62 11 L -52 5 L -50 0 L -44 -2 L -38 -5 L -35 -8 L -39 -14 L -48 -25 L -54 -34 L -58 -39 L -62 -41 L -65 -46 L -68 -52 L -70 -55 L -74 -52 L -73 -45 L -72 -38 L -71 -30 L -73 -20 L -76 -14 L -79 -6 L -81 -2 L -80 3 Z",
  // Africa — west bulge, Gulf of Guinea, the Cape, the Horn, and up the Red Sea
  // to Suez.
  "M -6 36 L -13 28 L -17 21 L -17 15 L -13 8 L -8 5 L 0 5 L 6 4 L 9 4 L 9 -1 L 12 -6 L 13 -13 L 15 -23 L 18 -34 L 25 -34 L 32 -29 L 35 -24 L 40 -16 L 40 -10 L 39 -6 L 43 -2 L 51 2 L 51 11 L 45 12 L 43 12 L 39 15 L 37 22 L 34 28 L 32 31 L 25 32 L 18 30 L 11 34 L 3 36 Z",
  // Eurasia — one path from Gibraltar around the Arctic to Kamchatka, then down
  // the Pacific coast, around India and Arabia, and back along the
  // Mediterranean.
  "M -6 36 L -9 39 L -9 43 L -2 43 L -1 46 L -4 48 L 2 51 L 4 53 L 8 54 L 10 57 L 13 54 L 19 54 L 21 56 L 24 57 L 28 60 L 30 60 L 25 65 L 21 65 L 30 70 L 40 68 L 55 68 L 70 72 L 80 74 L 100 76 L 110 76 L 130 73 L 145 70 L 160 69 L 170 66 L 180 65 L 170 60 L 162 60 L 155 57 L 145 54 L 140 45 L 135 43 L 130 42 L 128 38 L 122 38 L 120 33 L 122 30 L 115 23 L 108 18 L 105 10 L 100 13 L 98 8 L 100 3 L 95 5 L 94 16 L 90 22 L 87 21 L 80 15 L 77 8 L 74 15 L 72 20 L 68 24 L 61 25 L 57 25 L 50 29 L 48 30 L 56 25 L 58 22 L 52 15 L 45 12 L 43 13 L 39 20 L 35 28 L 34 31 L 36 36 L 30 36 L 28 37 L 26 40 L 23 40 L 20 40 L 19 42 L 13 45 L 13 38 L 16 38 L 12 44 L 8 44 L 3 43 Z",
  // British Isles
  "M -5 50 L -3 51 L 1 51 L 2 53 L -1 55 L -3 58 L -5 58 L -6 56 L -5 53 Z",
  "M -10 52 L -6 54 L -6 55 L -10 55 Z",
  // Scandinavia — cut in as its own shape so the Baltic doesn't fill solid.
  "M 5 58 L 8 58 L 11 59 L 14 64 L 18 69 L 22 70 L 29 71 L 25 65 L 21 65 L 17 61 L 12 59 L 8 57 Z",
  // Italy
  "M 7 44 L 12 46 L 14 45 L 17 41 L 18 40 L 16 38 L 15 40 L 12 42 L 9 43 Z",
  // Japan
  "M 130 32 L 132 34 L 136 35 L 139 38 L 141 41 L 142 45 L 145 44 L 141 40 L 138 36 L 134 33 L 131 31 Z",
  // Australia
  "M 114 -22 L 122 -18 L 130 -12 L 137 -11 L 142 -11 L 145 -15 L 146 -19 L 150 -22 L 153 -26 L 150 -32 L 150 -37 L 146 -39 L 140 -38 L 136 -35 L 129 -32 L 123 -34 L 118 -35 L 115 -34 L 113 -26 Z",
  // New Zealand
  "M 173 -35 L 178 -38 L 175 -41 L 171 -42 L 173 -39 Z",
  "M 168 -44 L 172 -41 L 168 -46 L 166 -46 Z",
  // Madagascar
  "M 44 -12 L 50 -15 L 50 -25 L 45 -25 L 43 -18 Z",
  // Borneo, Sumatra, Java, New Guinea
  "M 109 -4 L 117 -3 L 119 2 L 114 7 L 109 2 Z",
  "M 95 5 L 99 3 L 106 -3 L 104 -6 L 96 0 Z",
  "M 105 -6 L 114 -7 L 114 -9 L 105 -9 Z",
  "M 131 -2 L 141 -3 L 150 -6 L 147 -9 L 138 -8 L 131 -5 Z",
  // Philippines
  "M 120 18 L 124 16 L 126 10 L 122 6 L 120 12 Z",
  // Sri Lanka
  "M 80 10 L 82 8 L 81 6 L 79 7 Z",
];

/**
 * Where the equirectangular map's edges sit, in degrees.
 *
 * The south edge stops at 58°S: it clears Tierra del Fuego and every region on
 * the map, and going further would add empty Southern Ocean to the frame.
 */
export const MAP_BOUNDS = { lonMin: -180, lonMax: 180, latMin: -58, latMax: 82 };

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
 * expects; a proper projection would be a dependency for no gain at this size.
 */
export function project(lon: number, lat: number): { x: number; y: number } {
  const { lonMin, lonMax, latMin, latMax } = MAP_BOUNDS;
  return {
    x: ((lon - lonMin) / (lonMax - lonMin)) * MAP_SIZE.width,
    y: ((latMax - lat) / (latMax - latMin)) * MAP_SIZE.height,
  };
}
