import { splitStringAccordingToLengthAndDelimiter } from '@utils/split-string-according-to-length-and-delimiter.js'

test('splitStringAccordingToLengthAndDelimiter', () => {
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
