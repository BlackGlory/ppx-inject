import { IPv4AddressRange, IPv6AddressRange, AddressRange, concatAddressRanges, removeIntersections, removeSubsets } from '@src/address-range'

describe('AddressRange', () => {
  describe('isSubSetOf(addressRange: AddressRange)', () => {
    it('return boolean', () => {
      const range1 = new AddressRange(0n, 100n)
      const range2 = new AddressRange(0n, 50n)
      const range3 = new AddressRange(50n, 100n)

      const result1 = range1.isSubSetOf(range2)
      const result2 = range1.isSubSetOf(range3)
      const result3 = range2.isSubSetOf(range1)
      const result4 = range2.isSubSetOf(range3)
      const result5 = range3.isSubSetOf(range1)
      const result6 = range3.isSubSetOf(range2)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
      expect(result4).toBe(false)
      expect(result5).toBe(true)
      expect(result6).toBe(false)
    })
  })
})

describe('IPv4AddressRange', () => {
  describe('create(startAddress: string, hosts: number)', () => {
    it('return { startAddress: BigInt, endAddress: BigInt }', () => {
      const startAddress = '1.0.1.0'
      const hosts = 256

      const result = IPv4AddressRange.create(startAddress, hosts)

      expect(result.startAddress).toBe(16777472n)
      expect(result.endAddress).toBe(16777727n)
    })
  })

  describe('toString()', () => {
    it('return "$startAddress-$endAddress"', () => {
      const startAddress = '1.0.1.0'
      const hosts = 256

      const range = IPv4AddressRange.create(startAddress, hosts)
      const result = range.toString()

      expect(result).toBe('1.0.1.0-1.0.1.255')
    })
  })
})

describe('IPv6AddressRange', () => {
  describe('create(startAddress: string, cidr: number)', () => {
    it('return { startAddress: BigInt, endAddress: BigInt }', () => {
      const startAddress = '2001:250::'
      const cidr = 35

      const result = IPv6AddressRange.create(startAddress, cidr)

      expect(result.startAddress).toBe(42540535065048051205038211803318845440n)
      expect(result.endAddress).toBe(42540535074951571519321254002511839231n)
    })
  })

  describe('toString()', () => {
    it('return "$startAddress-$endAddress"', () => {
      const startAddress = '2001:250::'
      const cidr = 35

      const range = IPv6AddressRange.create(startAddress, cidr)
      const result = range.toString()

      expect(result).toBe('2001:250::-2001:250:1fff:ffff:ffff:ffff:ffff:ffff')
    })
  })
})

describe('concatAddressRanges(ranges: AddressRange[], constructor: new (startAddress: BigInt, endAddress: BigInt) => AddressRange): AddressRange[]', () => {
  it('return concated AddressRange collection', () => {
    const range1 = new AddressRange(0n, 100n)
    const range2 = new AddressRange(101n, 200n)
    const range3 = new AddressRange(201n, 300n)
    const iter = [range1, range2, range3]

    const result = concatAddressRanges(iter, AddressRange)

    expect(result.length).toBe(1)
    expect(result[0]).toBeInstanceOf(AddressRange)
    expect(result[0].startAddress).toBe(0n)
    expect(result[0].endAddress).toBe(300n)
  })
})

describe('removeSubsets(ranges: AddressRange[]): AddressRange[]', () => {
  it('return ranges removed subsets', () => {
    const range1 = new AddressRange(0n, 100n)
    const range2 = new AddressRange(0n, 200n)
    const range3 = new AddressRange(0n, 300n)
    const iter = [range1, range2, range3]

    const result = removeSubsets(iter)

    expect(result.length).toBe(1)
    expect(result[0]).toBeInstanceOf(AddressRange)
    expect(result[0].startAddress).toBe(0n)
    expect(result[0].endAddress).toBe(300n)
  })
})

describe('removeIntersections(ranges: AddressRange[]): AddressRange[]', () => {
  describe('[0, 50] [50, 150] [150, 200]', () => {
    it('return ranges removed intersections', () => {
      const iter = [
        new AddressRange(0n, 50n)
      , new AddressRange(50n, 150n)
      , new AddressRange(150n, 200n)
      ]

      const result = removeIntersections(iter, AddressRange)

      expect(result.length).toBe(1)
      expect(result[0]).toBeInstanceOf(AddressRange)
      expect(result[0].startAddress).toBe(0n)
      expect(result[0].endAddress).toBe(200n)
    })
  })

  describe('[0, 100] [50, 150] [100, 200]', () => {
    it('return ranges removed intersections', () => {
      const iter = [
        new AddressRange(0n, 100n)
      , new AddressRange(50n, 150n)
      , new AddressRange(100n, 200n)
      ]

      const result = removeIntersections(iter, AddressRange)

      expect(result.length).toBe(1)
      expect(result[0]).toBeInstanceOf(AddressRange)
      expect(result[0].startAddress).toBe(0n)
      expect(result[0].endAddress).toBe(200n)
    })
  })
})
