import type { Feature, FeatureCollection, Geometry, GeoJsonProperties, Position } from 'geojson'

function convertGeoJSONToKML(geojson: FeatureCollection | Feature): string {
  const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson]

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
  <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>`

  function style(feature: any): string {
    return `    <Style id="polygonStyle">
      <PolyStyle>
        <color>0</color>
      </PolyStyle>
      <LineStyle>
        <color>${feature.property?.stroke ?? 'ff0000ff'}</color>
        <width>${feature.property?.['stroke-width'] ?? 1}</width>
      </LineStyle>
    </Style>
    `
  }

  // Iterate through each feature
  for (const feature of features) {
    if (!feature.geometry) {
      // Skip features without geometry
      continue
    }

    kml += style(feature)

    const geometry: Geometry = feature.geometry
    const properties: GeoJsonProperties = feature.properties || {}

    // Retrieve metadata for name and description from properties
    const name = properties.name || ''
    const description = properties.description || ''

    // Decide whether to apply polygon style (only for Polygon / MultiPolygon)
    const isPolygon = geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
    const styleTag = isPolygon ? `<styleUrl>#polygonStyle</styleUrl>` : ''

    // Build Placemark
    kml += `    <Placemark>
        ${styleTag}
        <name>${escapeXml(name)}</name>
        <description>${escapeXml(description)}</description>
  `

    // Handle geometry by type
    switch (geometry.type) {
      case 'Point':
        kml += handlePoint(geometry.coordinates as Position)
        break
      case 'MultiPoint':
        kml += handleMultiPoint(geometry.coordinates as Position[])
        break
      case 'LineString':
        kml += handleLineString(geometry.coordinates as Position[])
        break
      case 'MultiLineString':
        kml += handleMultiLineString(geometry.coordinates as Position[][])
        break
      case 'Polygon':
        kml += handlePolygon(geometry.coordinates as Position[][])
        break
      case 'MultiPolygon':
        kml += handleMultiPolygon(geometry.coordinates as Position[][][])
        break
      default:
        // Fallback if geometry type is not supported
        kml += `      <!-- Unsupported geometry type: ${geometry.type} -->\n`
        break
    }

    // Close Placemark
    kml += `    </Placemark>\n`
  }

  // Close KML document
  kml += `  </Document>
  </kml>
  `

  return kml
}

/** Helper to escape XML special characters */
function escapeXml(str: any): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Convert a single [longitude, latitude, (alt)?] array to KML <Point> */
function handlePoint(coordinates: Position): string {
  const [lng, lat, alt] = coordinates
  return `      <Point>
          <coordinates>${lng},${lat}${alt !== undefined ? ',' + alt : ''}</coordinates>
        </Point>
  `
}

/** Convert an array of points [[lng, lat], [lng, lat], ...] to multiple KML Points */
function handleMultiPoint(coordinatesArray: Position[]): string {
  let result = ''
  for (const coords of coordinatesArray) {
    const [lng, lat, alt] = coords
    result += `      <Point>
          <coordinates>${lng},${lat}${alt !== undefined ? ',' + alt : ''}</coordinates>
        </Point>
  `
  }
  return result
}

/** Convert an array of points [[lng, lat], [lng, lat], ...] to KML <LineString> */
function handleLineString(coordinatesArray: Position[]): string {
  // KML coordinates are space-separated "longitude,latitude[,altitude]"
  const coords = coordinatesArray.map((c) => c.join(',')).join(' ')
  return `      <LineString>
          <coordinates>${coords}</coordinates>
        </LineString>
  `
}

/** Convert multiple LineStrings [[[lng, lat], ...], [[lng, lat], ...], ...] */
function handleMultiLineString(multiCoords: Position[][]): string {
  let result = ''
  for (const coordsArray of multiCoords) {
    const coords = coordsArray.map((c) => c.join(',')).join(' ')
    result += `      <LineString>
          <coordinates>${coords}</coordinates>
        </LineString>
  `
  }
  return result
}

/**
 * Convert a Polygon array: [outerRing, hole1, hole2, ...]
 * Each ring is an array of [lng, lat, (alt)?] positions
 */
function handlePolygon(coordsArray: Position[][]): string {
  // The first ring is outerBoundary; subsequent rings are innerBoundary (holes)
  let result = `      <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${ringToKml(coordsArray[0])}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
  `

  // Holes
  for (let i = 1; i < coordsArray.length; i++) {
    result += `        <innerBoundaryIs>
            <LinearRing>
              <coordinates>${ringToKml(coordsArray[i])}</coordinates>
            </LinearRing>
          </innerBoundaryIs>
  `
  }

  result += `      </Polygon>
  `
  return result
}

/**
 * Convert a MultiPolygon array:
 * [
 *   [ [outerRing], [hole1], [hole2] ],
 *   [ [outerRing], ... ],
 *   ...
 * ]
 */
function handleMultiPolygon(multiPolyCoords: Position[][][]): string {
  let result = ''
  for (const polygon of multiPolyCoords) {
    result += `      <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${ringToKml(polygon[0])}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
  `
    // Holes
    for (let i = 1; i < polygon.length; i++) {
      result += `        <innerBoundaryIs>
            <LinearRing>
              <coordinates>${ringToKml(polygon[i])}</coordinates>
            </LinearRing>
          </innerBoundaryIs>
  `
    }
    result += `      </Polygon>
  `
  }
  return result
}

/** Convert a single ring (array of [lng, lat, (alt)?] positions) to space-separated KML coordinates */
function ringToKml(ring: Position[]): string {
  return ring.map((coords) => coords.join(',')).join(' ')
}

export default convertGeoJSONToKML
