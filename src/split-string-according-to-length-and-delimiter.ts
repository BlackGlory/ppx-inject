import { Cons, convertConsToArray } from '@blackglory/structures'

export function splitStringAccordingToLengthAndDelimiter(str: string, sliceMaximumLength: number, delimiter: string): string[] {
  return convertConsToArray(slice(str))

  function slice(str: string): Cons<string> {
    if (str.length > sliceMaximumLength) {
      const endIndex = str.lastIndexOf(delimiter, sliceMaximumLength - 1)
      const value = str.slice(0, endIndex)
      const next = slice(str.slice(endIndex + delimiter.length))
      return [value, next]
    } else {
      return [str, null]
    }
  }
}
