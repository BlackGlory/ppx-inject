import * as ip from 'ip'
import { Address6 } from 'ip-address'
import { HashSet } from './hash-set'

export class AddressRange {
  constructor(public readonly startAddress: bigint, public readonly endAddress: bigint) {}

  isSubSetOf(addressRange: AddressRange): boolean {
    return this.startAddress >= addressRange.startAddress
        && this.endAddress <= addressRange.endAddress
  }

  hasIntersectionOf(addressRange: AddressRange): boolean {
    return this.hasRightIntersectionOf(addressRange)
        || this.hasLeftIntersectionOf(addressRange)
  }

  hasLeftIntersectionOf(addressRange: AddressRange): boolean {
    return this.startAddress <= addressRange.endAddress
        && this.endAddress >= addressRange.endAddress
  }

  hasRightIntersectionOf(addressRange: AddressRange): boolean {
    return this.startAddress <= addressRange.startAddress
        && this.endAddress >= addressRange.startAddress
  }

  toString(): string {
    return `${this.startAddress}-${this.endAddress}`
  }
}

export class IPv4AddressRange extends AddressRange {
  static create(startAddress: string, hosts: number): AddressRange {
    const endAddress = ip.fromLong(ip.toLong(startAddress) + hosts - 1)
    return new IPv4AddressRange(
      convertIPv4AddressStringToBigInt(startAddress)
    , convertIPv4AddressStringToBigInt(endAddress)
    )
  }

  toString(): string {
    const startAddress = convertIPv4AddressBigIntToString(this.startAddress)
    const endAddress = convertIPv4AddressBigIntToString(this.endAddress)
    return `${startAddress}-${endAddress}`
  }
}

export class IPv6AddressRange extends AddressRange {
  static create(startAddress: string, cidr: number): AddressRange {
    const endAddress = new Address6(`${startAddress}/${cidr}`).endAddress().address
    return new IPv6AddressRange(
      convertIPv6AddressStringToBigInt(startAddress)
    , convertIPv6AddressStringToBigInt(endAddress)
    )
  }

  toString(): string {
    const startAddress = shortenIPv6Address(convertIPv6AddressBigIntToString(this.startAddress))
    const endAddress = shortenIPv6Address(convertIPv6AddressBigIntToString(this.endAddress))
    return `${startAddress}-${endAddress}`
  }
}

export function concatAddressRanges<T extends AddressRange>(ranges: T[], constructor: new (startAddress: bigint, endAddress: bigint) => T): T[] {
  const map = convertIterableToMap(ranges)
  let count = 0
  for (;;) {
    const lastRoundCount = count
    for (const [start, end] of map) {
      const target = end + 1n
      if (map.has(target)) {
        const newEnd = map.get(target)!
        map.delete(target)
        map.set(start, newEnd)
        count++
      }
    }
    if (lastRoundCount === count) break
  }
  const result = convertMapToArray(map)
  return result

  function convertIterableToMap(iterable: Iterable<T>): Map<bigint, bigint> {
    const collection = new Map<bigint, bigint>()
    for (const range of iterable) {
      collection.set(range.startAddress, range.endAddress)
    }
    return collection
  }

  function convertMapToArray(map: Map<bigint, bigint>): T[] {
    const result: T[] = []
    for (const [startAddress, endAddress] of map) {
      result.push(new constructor(startAddress, endAddress))
    }
    return result
  }
}

export function removeSubsets<T extends AddressRange>(ranges: T[]): T[] {
  const subsets = new WeakSet<T>()
  for (const current of ranges) {
    if (findSuperSet(ranges, current)) subsets.add(current)
  }
  return ranges.filter(x => !subsets.has(x))

  function findSuperSet(collection: T[], subject: T): boolean {
    for (const object of collection) {
      if (subject === object) continue
      if (subject.isSubSetOf(object)) return true
    }
    return false
  }
}

export function removeIntersections<T extends AddressRange>(ranges: T[], constructor: new (startAddress: bigint, endAddress: bigint) => T): T[] {
  const intersections = new WeakSet<T>()
  const news = new HashSet<T>(range => range.toString())
  for (const current of ranges) {
    if (intersections.has(current)) continue
    const right = findRightIntersection(ranges, current)
    if (right) {
      intersections.add(current)
      intersections.add(right)
      news.add(new constructor(current.startAddress, right.endAddress))
    }
  }

  if (news.size === 0) {
    return ranges
  } else {
    return removeIntersections(
      ranges
        .filter(x => !intersections.has(x))
        .concat(Array.from(news))
    , constructor
    )
  }

  function findRightIntersection(collection: T[], subject: T): T | null {
    for (const object of collection) {
      if (subject === object) continue
      if (subject.hasRightIntersectionOf(object)) return object
    }
    return null
  }
}

function convertIPv6AddressStringToBigInt(address: string): bigint {
  const hex = new Address6(address).canonicalForm().split(':').join('')
  return BigInt(`0x${hex}`)
}

function convertIPv6AddressBigIntToString(address: bigint): string {
  const hex = address.toString(16).padStart(32, '0')
  const groups = []
  for (let i = 0; i < 8; i++) {
    groups.push(hex.slice(i * 4, (i + 1) * 4))
  }
  return groups.join(':')
}

function convertIPv4AddressStringToBigInt(address: string): bigint {
  return BigInt(ip.toLong(address))
}

function convertIPv4AddressBigIntToString(address: bigint): string {
  return ip.fromLong(Number(address))
}

function shortenIPv6Address(address: string): string {
  return new Address6(address).correctForm()
}
