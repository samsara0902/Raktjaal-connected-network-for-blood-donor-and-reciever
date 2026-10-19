import ngeohash from "ngeohash";

/** Precision 6 ≈ up to ~1.2km x 0.6km cells — good balance for a 10km search radius. */
export const GEOHASH_PRECISION = 6;

export function encodeGeohash(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, GEOHASH_PRECISION);
}

/**
 * Returns the geohash cell plus its 8 neighbors, so a radius search near a
 * cell boundary doesn't miss donors who fall just outside the center cell.
 */
export function geohashSearchCells(lat: number, lng: number): string[] {
  const center = encodeGeohash(lat, lng);
  const neighbors = ngeohash.neighbors(center);
  return [center, ...neighbors];
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Coarse precision used for the wide "donors near me" search on /action.
 * Precision 4 cells are ~39km x 19.5km. One neighbor ring gives the 3x3 block
 * used for the 25 km search; three rings give a 7x7 block for the 50 km
 * fallback. The exact haversine filter trims both results to their true radius.
 * (Precision 6, above, is only ~1km of reach, far too small for this search.)
 */
export const WIDE_GEOHASH_PRECISION = 4;

export function encodeWideGeohash(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, WIDE_GEOHASH_PRECISION);
}

export function wideGeohashSearchCells(
  lat: number,
  lng: number,
  rings = 1
): string[] {
  const center = encodeWideGeohash(lat, lng);
  const cells = new Set<string>([center]);
  let frontier = [center];
  const ringCount = Math.max(0, Math.floor(rings));

  for (let ring = 0; ring < ringCount; ring++) {
    const next = new Set<string>();
    for (const cell of frontier) {
      for (const neighbor of ngeohash.neighbors(cell)) {
        if (!cells.has(neighbor)) {
          cells.add(neighbor);
          next.add(neighbor);
        }
      }
    }
    frontier = Array.from(next);
  }

  return Array.from(cells);
}
