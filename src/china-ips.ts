import { concatAddressRanges, removeIntersections, IPv4AddressRange, IPv6AddressRange } from './address-range'
import { parseStatisticsFile, isRecord, IRecord } from 'internet-number'
import { toArrayAsync } from 'iterable-operator'
import { AsyncIterableOperator } from 'iterable-operator/lib/es2018/style/chaining'

export async function parseChinaIPAddressRanges(filename: string): Promise<Array<IPv4AddressRange | IPv6AddressRange>> {
  const records = await toArrayAsync(parseChinaRecords(filename))
  return convertRecordsToRanges(records)
}

async function* parseChinaRecords(filename: string): AsyncIterable<IRecord> {
  const chinaRecords = new AsyncIterableOperator(parseStatisticsFile(filename))
    .filterAsync<IRecord>(isRecord)
    .filterAsync(record => record.cc === 'CN')
  yield* chinaRecords
}

export function convertRecordsToRanges(records: IRecord[]): Array<IPv4AddressRange | IPv6AddressRange> {
  const ipv4Ranges = records
    .filter(x => x.type === 'ipv4')
    .map(x => {
      const startAddress = x.start
      const hosts = Number.parseInt(x.value, 10)
      return IPv4AddressRange.create(startAddress, hosts)
    })

  const ipv6Ranges = records
    .filter(x => x.type === 'ipv6')
    .map(x => {
      const startAddress = x.start
      const cidr = Number.parseInt(x.value, 10)
      return IPv6AddressRange.create(startAddress, cidr)
    })

  const cleanIPv4Ranges = pipe(ipv4Ranges, [
    xs => concatAddressRanges(xs, IPv4AddressRange)
  , xs => removeIntersections(xs, IPv4AddressRange)
  ])

  const cleanIPv6Ranges = pipe(ipv6Ranges, [
    xs => concatAddressRanges(xs, IPv6AddressRange)
  , xs => removeIntersections(xs, IPv6AddressRange)
  ])

  return [...cleanIPv4Ranges, ...cleanIPv6Ranges]
}

function pipe<T>(x: T, operators: Array<(xs: T) => T>): T {
  let result = x
  for (const fn of operators) {
    result = fn(result)
  }
  return result
}
