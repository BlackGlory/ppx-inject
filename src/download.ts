import path from 'path'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import { pathExists, ensureDir, move, remove } from 'extra-filesystem'
import {
  fetchLatestChecksum
, fetchLatestStatisticsFile
, Domain
, Registry
} from 'internet-number'

export async function downloadStatistics(dataDirname: string): Promise<string> {
  if (await isDataFilesExisted(dataDirname)) {
    console.info('Checking for updates...')
    const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)

    if (await getExistedChecksum(dataDirname) !== checksum) {
      console.info('Cleaning expired files...')
      await cleanExpiredFiles(dataDirname)

      await saveChecksum(dataDirname, checksum)

      console.info('Downloading the latest statistics file...')
      await downloadStatisticsFile(dataDirname)
    }
  } else {
    await ensureDir(dataDirname)

    console.info('Downloading the latest checksum file...')
    await downloadChecksum(dataDirname)

    console.info('Downloading the latest statistics file...')
    await downloadStatisticsFile(dataDirname)
  }

  return getStatisticsPath(dataDirname)
}

async function downloadChecksum(dataDirname: string): Promise<void> {
  const checksum = await fetchLatestChecksum(Domain.APNIC, Registry.APNIC)
  await saveChecksum(dataDirname, checksum)
}

async function isDataFilesExisted(dataDirname: string): Promise<boolean> {
  return await pathExists(dataDirname)
      && await pathExists(getChecksumPath(dataDirname))
      && await pathExists(getStatisticsPath(dataDirname))
}

async function cleanExpiredFiles(dataDirname: string): Promise<void> {
  await remove(getChecksumPath(dataDirname))
  await remove(getStatisticsPath(dataDirname))
}

async function getExistedChecksum(dataDirname: string): Promise<string> {
  return await fs.readFile(getChecksumPath(dataDirname), { encoding: 'utf8' })
}

async function saveChecksum(dataDirname: string, checksum: string): Promise<void> {
  await fs.writeFile(getChecksumPath(dataDirname), checksum)
}

async function downloadStatisticsFile(dataDirname: string): Promise<void> {
  const rs = await fetchLatestStatisticsFile(Domain.APNIC, Registry.APNIC)
  const tempFilename = getStatisticsPath(dataDirname) + '.downloading'
  const ws = createWriteStream(tempFilename)
  await pipeline(rs, ws)
  await move(tempFilename, getStatisticsPath(dataDirname))
}

function getStatisticsPath(dataDirname: string): string {
  return path.resolve(dataDirname, 'statistics')
}

function getChecksumPath(dataDirname: string): string {
  return path.resolve(dataDirname, 'checksum')
}
