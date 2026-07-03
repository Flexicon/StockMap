import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export type GoogleMapsApi = {
  maps: google.maps.MapsLibrary
  marker: google.maps.MarkerLibrary
  places: google.maps.PlacesLibrary
}

let mapsPromise: Promise<GoogleMapsApi> | null = null

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (!apiKey) throw new Error('Missing Google Maps browser key')

  if (!mapsPromise) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    mapsPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('places'),
    ]).then(([maps, marker, places]) => ({ maps, marker, places }))
  }

  return mapsPromise
}
