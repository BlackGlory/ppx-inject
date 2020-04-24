import { writeProfileFile, createTargetsFromAddressRanges, readProfileFile,updateProfile, getRuleList, createDirectRules, mergeRuleList } from './profile'
import { parseChinaIPAddressRanges } from './china-ips'
import * as fs from 'fs-extra'
import { fetchLatestChecksum, fetchLatestStatisticsFile, Domain, Registry } from 'internet-number'
import * as path from 'path'

;(async () => {
  const filename = process.argv[2]
  if (!filename) {
    console.error('The argument filename is required.')
    process.exit(1)
  }

  if (await isDataFilesExisted()) {
    console.info('Checking for updates...')
    const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)

    if (await getExistedChecksum() !== checksum) {
      await saveChecksum(checksum)

      console.info('Downloading the latest statistics file...')
      await downloadStatisticsFile()
    }
  } else {
    await ensureDataPath()
    console.info('Downloading the latest checksum file...')
    await downloadChecksum()

    console.info('Downloading the latest statistics file...')
    await downloadStatisticsFile()
  }

  console.info('Updating the profile...')
  const chinaIpRanges = await parseChinaIPAddressRanges(getStatisticsPath())
  const targets = createTargetsFromAddressRanges(chinaIpRanges)
  const profile = await readProfileFile(filename)
  const newRuleList = mergeRuleList(getRuleList(profile), createDirectRules(targets))
  const newProfile = updateProfile(profile, newRuleList)
  await writeProfileFile(filename, newProfile)
  console.info('Done.\n')

  console.info('Please run the command to load the new profile file:')
  console.info(`Proxifier ${path.resolve(filename)} silent-load`)
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
