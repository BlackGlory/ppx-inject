import { splitCount } from '@src/split-count'

describe('splitCount(str: string, limit: number, separator: string)', () => {
  it('return string[]', () => {
    const str = '1; 2; 3; 4; 5; 6; 7; 8; 9; 10'
    const limit = 5
    const sep = '; '

    const result = splitCount(str, limit, sep)

    expect(result).toEqual([
      '1; 2'
    , '3; 4'
    , '5; 6'
    , '7; 8'
    , '9; 10'
    ])
  })
})
