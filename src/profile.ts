import { IPv4AddressRange, IPv6AddressRange } from './address-range'
import { splitCount } from './split-count'
import { promises as fs } from 'fs'
import * as xml2js from 'xml2js'
import { nanoid } from 'nanoid'
import produce from 'immer'

interface Rule {
  $: { enabled: 'true' | 'false' }
  Name: [string]
  Applications?: [string]
  Targets?: [string]
  Action: [{
    $: { type: 'Direct' | string }
  }]
}

interface Profile {
  ProxifierProfile: {
    RuleList: [{ Rule: Rule[] }]
  }
}

export async function readProfileFile(filename: string): Promise<Profile> {
  const text = await fs.readFile(filename, { encoding: 'utf8' })
  return await xml2js.parseStringPromise(text)
}

export async function writeProfileFile(filename: string, profile: Profile): Promise<void> {
  const xml = buildProfileXml(profile)
  await fs.writeFile(filename, xml, { encoding: 'utf8' })
}

export function updateProfile(profile: Profile, newRuleList: Rule[]): Profile {
  const newProfile = replaceRuleList(profile, newRuleList)
  return newProfile
}

export function createTargetsFromAddressRanges(ranges: Array<IPv4AddressRange | IPv6AddressRange>): string {
  return ranges
    .map(x => x.toString())
    .join(';')
}

export function getRuleList(profile: Profile): Rule[] {
  return profile.ProxifierProfile.RuleList[0].Rule
}

export function mergeRuleList(oldRuleList: Rule[], newRuleList: Rule[]): Rule[] {
  const defaultRule = last(oldRuleList)

  return oldRuleList
    .filter(isntProgramCreated)
    .filter(isnt(defaultRule))
    .concat(newRuleList)
    .concat([defaultRule])

  function isntProgramCreated(x: Rule): boolean {
    return !x.Name[0].includes(getProgramCreatedFlag())
  }

  function isnt(val: Rule): (val: Rule) => boolean {
    return (x: Rule) => x !== val
  }

  function last<T>(xs: T[]): T {
    return xs[xs.length - 1]
  }
}

export function createDirectRules(targets: string): Rule[] {
  const LIMIT_PER_RULE = 32767

  const group = splitCount(targets, LIMIT_PER_RULE, ';')

  return group.map(rule => createDirectRule('chinaips', rule))

  function createDirectRule(prefix: string, target: string): Rule {
    return {
      $: { enabled: 'true' }
    , Name: [prefix + '-' + nanoid() + ' ' + getProgramCreatedFlag()]
    , Targets: [target]
    , Action: [{
        $: { type: 'Direct' }
      }]
    }
  }
}

function replaceRuleList(profile: Profile, ruleList: Rule[]): Profile {
  return produce(profile, (profile => {
    profile.ProxifierProfile.RuleList[0].Rule = ruleList
  }))
}

function getProgramCreatedFlag() {
  return '[program-created]'
}

function buildProfileXml(profile: Profile): string {
  const builder = new xml2js.Builder()
  const xml = builder.buildObject(profile)
  return xml
}
