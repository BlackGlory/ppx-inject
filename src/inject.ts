import path from 'path'
import {
  writeProfileFile
, readProfileFile
, updateProfile
, getRuleList
, createDirectRules
, mergeRuleList
} from '@utils/profile.js'
import { parseAddressRangesFromStatisticsFile } from '@utils/statistics-file.js'

export async function injectDirectRulesIntoProfile(
  statisticsFilename: string
, cc: string[]
, profileFilename: string
): Promise<void> {
  console.info('Updating the profile...')

  const profile = await readProfileFile(profileFilename)
  const ipRanges = await parseAddressRangesFromStatisticsFile(
    statisticsFilename
  , cc
  )
  const newRuleList = mergeRuleList(
    getRuleList(profile)
  , createDirectRules(ipRanges)
  )
  const newProfile = updateProfile(profile, newRuleList)
  await writeProfileFile(profileFilename, newProfile)

  console.info('Done.\n')

  console.info('Please run the command to load the new profile file:')
  console.info(`Proxifier ${path.resolve(profileFilename)} silent-load`)
}
