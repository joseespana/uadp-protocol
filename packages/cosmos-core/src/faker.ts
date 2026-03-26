// Fictional brand names and helpers for data generation
export const FICTIONAL_BRANDS = {
  convenience: ['MiniExpress', 'QuickStop', 'CornerMart', 'Presto 24h'],
  coffee: ['Café Bósforo', 'Aroma Central', 'La Taza Dorada', 'Café Ventana'],
  restaurant: ['La Cocina de Sol', 'Bistro Alameda', 'Taquería Don Julio', 'Sushi Kaze'],
  grocery: ['SuperMart', 'FreshCo', 'Mercado Verde', 'Abarrotes Lupita'],
  electronics: ['TechZone', 'ByteShop', 'DigitalPlus', 'Circuito MX'],
  clothing: ['UrbanFit', 'Moda Central', 'HiloNegro', 'Vestimenta Co.'],
  transport: ['MetroBus CDMX', 'UberGo', 'DiDi Express', 'Taxi Seguro'],
  streaming: ['StreamPlus', 'MelodyWave', 'CinemaGo', 'PodcastHub'],
  software: ['CodeForge Pro', 'DesignLab', 'CloudSync', 'DevTools Pro'],
  music: ['LyraMusic', 'SonarBeats', 'RitmoFM', 'OndaSonora'],
  vod: ['VortexPlay', 'CineNova', 'ScreenBox', 'RelayFilms'],
  food_delivery: ['FlameEats', 'ComiRapido', 'BocadoYa', 'EntregaFacil'],
  rideshare: ['CompassGo', 'ViaRapido', 'RutaExpress', 'MueveMX'],
} as const

export const MEXICAN_CITIES = [
  'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro',
  'Mérida', 'Cancún', 'Oaxaca', 'San Miguel de Allende', 'Tijuana'
] as const

export const TECH_TOPICS = [
  'JavaScript', 'TypeScript', 'Rust', 'Go', 'Python', 'Solid.js', 'React',
  'Bun', 'Deno', 'WebAssembly', 'AI', 'LLMs', 'Kubernetes', 'Linux',
  'Open Source', 'Startups', 'Fintech', 'Blockchain', 'APIs', 'DevOps'
] as const

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickMultiple<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export function tsFromDaysAgo(days: number): number {
  return Math.floor((Date.now() - days * 86400000) / 1000)
}
