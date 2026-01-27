/**
 * Simple in-memory cache utility for API responses
 * 
 * Provides TTL-based caching to reduce redundant API calls
 * and improve application performance.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();

  /**
   * Sets a value in the cache with specified TTL
   * @param key - Unique identifier for the cache entry
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, data: T, ttl: number = 300000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, entry);
  }

  /**
   * Gets a value from the cache if it exists and hasn't expired
   * @param key - Unique identifier for the cache entry
   * @returns Cached data if valid, null otherwise
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Checks if a key exists in the cache and hasn't expired
   * @param key - Unique identifier for the cache entry
   * @returns True if valid entry exists, false otherwise
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Deletes a specific entry from the cache
   * @param key - Unique identifier for the cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes all expired entries from the cache
   */
  clean(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets the current size of the cache
   * @returns Number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Create singleton instances for different data types
export const apiCache = new Cache<any>();
export const driverCache = new Cache<any>();
export const raceCache = new Cache<any>();
export const leagueCache = new Cache<any>();

/**
 * Generic caching function for API calls
 * 
 * @param cache - Cache instance to use
 * @param key - Unique cache key
 * @param fetchFn - Function that fetches the data
 * @param ttl - Time to live in milliseconds
 * @returns Promise resolving to cached or fresh data
 */
export async function getCachedData<T>(
  cache: Cache<T>,
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300000
): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  cache.set(key, data, ttl);

  return data;
}

/**
 * Creates a cache key from URL and parameters
 * 
 * @param url - API endpoint URL
 * @param params - Query or path parameters
 * @returns Formatted cache key
 */
export function createCacheKey(url: string, params?: Record<string, any>): string {
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    return `${url}?${queryString}`;
  }
  return url;
}
