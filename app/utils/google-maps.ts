import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let mapsPromise: Promise<typeof google> | null = null

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (!apiKey) throw new Error('Missing Google Maps browser key')

  if (!mapsPromise) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    })

    mapsPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
    ]).then(() => google)
  }

  return mapsPromise
}
