import { createDirectRules } from '@utils/profile.js'
import { IPv4AddressRange, IPv6AddressRange } from 'address-range'

describe('createDirectRules', () => {
  test('general', () => {
    const ipRanges: Array<IPv4AddressRange | IPv6AddressRange> = [
      // "0.0.0.10-0.0.0.255".length = 18
      new IPv4AddressRange(BigInt(10), BigInt(255))
      // "0.0.1.0-0.0.2.0".length = 15
    , new IPv4AddressRange(BigInt(256), BigInt(512))
      // "0.0.2.1-0.0.4.10".length = 16
    , new IPv4AddressRange(BigInt(513), BigInt(1034))
    ]

    const result = createDirectRules(ipRanges, 32)

    expect(result).toMatchObject([
      {
        Targets: [
          '0.0.0.10-0.0.0.255' // 18 + 1 + 15 = 33 > 32
        ]
      }
    , {
        Targets: [
          '0.0.1.0-0.0.2.0;0.0.2.1-0.0.4.10' // 15 + 1 + 16 = 32
        ]
      }
    ])
  })

  test('edge: empty ipRanges', () => {
    const ipRanges: Array<IPv4AddressRange | IPv6AddressRange> = []

    const result = createDirectRules(ipRanges)

    expect(result).toEqual([])
  })
})
