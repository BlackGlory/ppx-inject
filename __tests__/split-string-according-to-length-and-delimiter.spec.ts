import { splitStringAccordingToLengthAndDelimiter } from '@src/split-string-according-to-length-and-delimiter'

describe('splitStringAccordingToLengthAndDelimiter(str: string, sliceMaximumLength: number, delimiter: string): string[]', () => {
  it('return string[]', () => {
    const str = '1; 2; 3; 4; 5; 6; 7; 8; 9; 10'
    const length = 5
    const delimiter = '; '

    const result = splitStringAccordingToLengthAndDelimiter(str, length, delimiter)

    expect(result).toEqual([
      '1; 2'
    , '3; 4'
    , '5; 6'
    , '7; 8'
    , '9; 10'
    ])
  })
})
