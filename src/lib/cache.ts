/**
 * In-memory + localStorage cache
 * Hierarchy: localStorage (persistent) > in-memory (session)
 *
 * Cache keys have TTL. Expired entries are ignored and re-fetched.
 */

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

// In-memory cache (fastest, cleared on page refresh)
const memoryCache = new Map<string, CacheEntry<unknown>>()

// TTL presets (ms)
export const TTL = {
  SHORT:   5 * 60 * 1000,       // 5 min  — search results
  MEDIUM:  30 * 60 * 1000,      // 30 min — paper metadata
  LONG:    4 * 60 * 60 * 1000,  // 4 hrs  — subjects, branches, semesters
  FOREVER: 24 * 60 * 60 * 1000, // 24 hrs — static config, syllabus
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expiresAt
}

// Write to both caches
export function cacheSet<T>(key: string, data: T, ttl: number): void {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl }
  memoryCache.set(key, entry as CacheEntry<unknown>)
  try {
    localStorage.setItem(`sru_cache:${key}`, JSON.stringify(entry))
  } catch {
    // localStorage may be full — memory cache still works
  }
}

// Read from memory first, then localStorage
export function cacheGet<T>(key: string): T | null {
  // 1. Check memory cache
  const mem = memoryCache.get(key)
  if (mem && !isExpired(mem)) return mem.data as T

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`sru_cache:${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (isExpired(entry)) {
      localStorage.removeItem(`sru_cache:${key}`)
      return null
    }
    // Warm memory cache
    memoryCache.set(key, entry as CacheEntry<unknown>)
    return entry.data
  } catch {
    return null
  }
}

export function cacheDelete(key: string): void {
  memoryCache.delete(key)
  localStorage.removeItem(`sru_cache:${key}`)
}

export function cacheDeletePattern(prefix: string): void {
  // Clear memory
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k)
  }
  // Clear localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k && k.startsWith(`sru_cache:${prefix}`)) localStorage.removeItem(k)
  }
}

/**
 * Cached async fetch — if result exists in cache, return it.
 * Otherwise call fetcher, cache result, return it.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== null) return cached

  const data = await fetcher()
  cacheSet(key, data, ttl)
  return data
}

/**
 * Request deduplication — if the same async operation is already in-flight,
 * return the same promise instead of starting a new one.
 */
const inFlight = new Map<string, Promise<unknown>>()

export async function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  // Check cache first
  const cached = cacheGet<T>(key)
  if (cached !== null) return cached

  // Check if already in-flight
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>
  }

  // Start new fetch, register in-flight
  const promise = fetcher()
    .then((data) => {
      cacheSet(key, data, ttl)
      inFlight.delete(key)
      return data
    })
    .catch((err) => {
      inFlight.delete(key)
      throw err
    })

  inFlight.set(key, promise)
  return promise
}
