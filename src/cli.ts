#!/usr/bin/env node
import { Command } from 'commander'
import {
  writeProfileFile
, createTargetsFromAddressRanges
, readProfileFile
, updateProfile
, getRuleList
, createDirectRules
, mergeRuleList
} from './profile'
import { parseAddressRangesFromStatisticsFile } from './ips'
import * as fs from 'fs-extra'
import {
  fetchLatestChecksum
, fetchLatestStatisticsFile
, Domain
, Registry
} from 'internet-number'
import * as path from 'path'

const program = new Command()

program
  .name(require('../package.json').name)
  .version(require('../package.json').version)
  .description(require('../package.json').description)
  .option('--cc <cc...>', 'ISO 3166 2-letter code of the organization to which the allocation or assignment was made.')
  .arguments('<profile>')
  .action(async () => {
    const opts = program.opts()
    const cc: string[] = opts.cc
    const profile: string = opts.profile

    await inject(cc, profile)
  })
  .parse(process.argv)

async function inject(cc: string[], profileFilename: string) {
  if (await isDataFilesExisted()) {
    console.info('Checking for updates...')
    const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)

    if (await getExistedChecksum() !== checksum) {
      console.info('Cleaning expired files...')
      await cleanExpiredFiles()

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
  const ipRanges = await parseAddressRangesFromStatisticsFile(
    getStatisticsPath()
  , cc
  )
  const targets = createTargetsFromAddressRanges(ipRanges)
  const profile = await readProfileFile(profileFilename)
  const newRuleList = mergeRuleList(getRuleList(profile), createDirectRules(targets))
  const newProfile = updateProfile(profile, newRuleList)
  await writeProfileFile(profileFilename, newProfile)
  console.info('Done.\n')

  console.info('Please run the command to load the new profile file:')
  console.info(`Proxifier ${path.resolve(profileFilename)} silent-load`)
}

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

async function cleanExpiredFiles() {
  await fs.remove(getChecksumPath())
  await fs.remove(getStatisticsPath())
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
  const tempFilename = getStatisticsPath() + '.downloading'
  const ws = fs.createWriteStream(tempFilename)
  await pipePromise(rs, ws)
  await fs.move(tempFilename, getStatisticsPath())
}

function getDataPath(file?: string): string {
  const dataDir = path.resolve(__dirname, '../data')
  if (file) {
    return path.join(dataDir, file)
  } else {
    return dataDir
  }
}

function pipePromise(
  readStream: NodeJS.ReadableStream
, writeStream: NodeJS.WritableStream
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = readStream.pipe(writeStream)
    stream.once('finish', resolve)
    stream.once('error', reject)
  })
}
