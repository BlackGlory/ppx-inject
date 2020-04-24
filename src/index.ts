import { buildProfileXml, createTargetsFromAddressRanges, readProxifierProfile,updateProfile, getRuleList, createDirectRules, mergeRuleList } from './profile'
import { parseChinaIPAddressRanges } from './china-ips'
import * as fs from 'fs-extra'
import { fetchLatestChecksum, fetchLatestStatisticsFile, Domain, Registry } from 'internet-number'
import * as path from 'path'
import fastify = require('fastify')

;(async () => {
  const filename = process.argv[2]
  if (!filename) {
    console.error('The argument filename is required.')
    process.exit(1)
  }
  const basename = path.basename(filename)

  if (await isDataFilesExisted()) {
    console.info('Download latest checksum...')
    const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)

    if (await getExistedChecksum() !== checksum) {
      console.info('The existed statistics file has expired.')
      await saveChecksum(checksum)

      console.info('Download latest statistics file...')
      await downloadStatisticsFile()
    }
  } else {
    await ensureDataPath()

    console.info('Download latest checksum...')
    await downloadChecksum()

    console.info('Download latest statistics file...')
    await downloadStatisticsFile()
  }

  const server = fastify()

  server.get(`/${basename}`, async (_, reply) => {
    const chinaIpRanges = await parseChinaIPAddressRanges(getStatisticsPath())
    const targets = createTargetsFromAddressRanges(chinaIpRanges)
    const profile = await readProxifierProfile(filename)
    const newRuleList = mergeRuleList(getRuleList(profile), createDirectRules(targets))
    const newProfile = updateProfile(profile, newRuleList)
    const xml = buildProfileXml(newProfile)

    await reply
      .type('application/xml')
      .send(xml)
    process.exit(0)
  })

  server.listen((err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.info('The one-time server will close after accessing the URL.')
    console.info('Please update single profile file from:')
    console.info(`${address}/${basename}`)
  })
})()

async function ensureDataPath() {
  return await fs.ensureDir(getDataPath())
}

function getStatisticsPath() {
  return getDataPath('statistics')
}

function getChecksumPath() {
  return getDataPath('checksum')
}

async function isDataFilesExisted(): Promise<boolean> {
  return await fs.pathExists(getDataPath())
      && await fs.pathExists(getChecksumPath())
      && await fs.pathExists(getStatisticsPath())
}

async function getExistedChecksum(): Promise<string> {
  return await fs.readFile(getChecksumPath(), { encoding: 'utf8' })
}

async function saveChecksum(checksum: string) {
  await fs.writeFile(getChecksumPath(), checksum)
}

async function downloadChecksum() {
  const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)
  await saveChecksum(checksum)
}

async function downloadStatisticsFile() {
  const rs = await fetchLatestStatisticsFile(Domain.APNIC, Registry.APNIC)
  const ws = fs.createWriteStream(getStatisticsPath())
  await pipePromise(rs, ws)
}

function getDataPath(file?: string): string {
  const dataDir = path.resolve(__dirname, '../data')
  if (file) {
    return path.join(dataDir, file)
  } else {
    return dataDir
  }
}

function pipePromise(readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = readStream.pipe(writeStream)
    stream.once('finish', resolve)
    stream.once('error', reject)
  })
}
