export class HashSet<T> implements Iterable<T> {
  #map = new Map<string, T>()

  constructor(private hash: (value: T) => string) {}

  add(value: T) {
    this.#map.set(this.hash(value), value)
    return this
  }

  delete(value: T) {
    return this.#map.delete(this.hash(value))
  }

  has(value: T) {
    return this.#map.has(this.hash(value))
  }

  clear() {
    this.#map.clear()
  }

  get size() {
    return this.#map.size
  }

  [Symbol.iterator]() {
    return this.#map.values()
  }
}
