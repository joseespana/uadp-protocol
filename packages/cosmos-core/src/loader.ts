import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const BASE_DATA_DIR = process.env.COSMOS_DATA_DIR || join(import.meta.dir, '..', '..', '..', 'data')

// Keep backward compat: loads jose_espana by default
export function loadData<T = unknown>(filename: string): T {
  return loadUserData<T>('jose_espana', filename)
}

export function loadDataArray<T = unknown>(filename: string): T[] {
  const data = loadData<T[]>(filename)
  return Array.isArray(data) ? data : []
}

// Load data for a specific user
export function loadUserData<T = unknown>(userId: string, filename: string): T {
  const filePath = join(BASE_DATA_DIR, userId, `${filename}.json`)
  if (!existsSync(filePath)) {
    console.warn(`Data file not found: ${filePath}, returning empty`)
    return {} as T
  }
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

// Load data for ALL users, returns Map<userId, T>
export function loadAllUsersData<T = unknown>(filename: string): Map<string, T> {
  const map = new Map<string, T>()
  for (const userId of getAvailableUsers()) {
    const filePath = join(BASE_DATA_DIR, userId, `${filename}.json`)
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8')
      map.set(userId, JSON.parse(raw) as T)
    }
  }
  return map
}

// Get available user IDs by scanning data directories
export function getAvailableUsers(): string[] {
  if (!existsSync(BASE_DATA_DIR)) return []
  return readdirSync(BASE_DATA_DIR).filter((entry) => {
    const fullPath = join(BASE_DATA_DIR, entry)
    return statSync(fullPath).isDirectory() && !entry.startsWith('.')
  })
}
