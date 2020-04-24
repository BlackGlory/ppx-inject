type Cons<T> = [T, Cons<T>] | [T, null]

export function splitCount(str: string, limit: number, separator: string): string[] {
  return expandCons(slice(str))

  function slice(str: string): Cons<string> {
    if (str.length > limit) {
      const endIndex = str.lastIndexOf(separator, limit - 1)
      const value = str.slice(0, endIndex)
      const next = slice(str.slice(endIndex + separator.length))
      return [value, next]
    } else {
      return [str, null]
    }
  }
}

function expandCons<T>([value, next]: Cons<T>): T[] {
  if (next === null) return [value]
  return [value, ...expandCons(next)]
}
