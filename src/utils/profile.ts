import { IPv4AddressRange, IPv6AddressRange } from 'address-range'
import { splitStringAccordingToLengthAndDelimiter } from '@utils/split-string-according-to-length-and-delimiter.js'
import { promises as fs } from 'fs'
import * as xml2js from 'xml2js'
import { nanoid } from 'nanoid'
import { produce } from 'immer'

interface IRule {
  $: { enabled: 'true' | 'false' }
  Name: [string]
  Applications?: [string]
  Targets?: [string]
  Action: [{
    $: { type: 'Direct' | string }
  }]
}

interface IProfile {
  ProxifierProfile: {
    RuleList: [{ Rule: IRule[] }]
  }
}

export async function readProfileFile(filename: string): Promise<IProfile> {
  const text = await fs.readFile(filename, { encoding: 'utf8' })
  return await xml2js.parseStringPromise(text)
}

export async function writeProfileFile(
  filename: string
, profile: IProfile
): Promise<void> {
  const xml = buildProfileXml(profile)
  await fs.writeFile(filename, xml, { encoding: 'utf8' })
}

export function updateProfile(profile: IProfile, newRuleList: IRule[]): IProfile {
  const newProfile = replaceRuleList(profile, newRuleList)
  return newProfile
}

export function createTargetsFromAddressRanges(
  ranges: Array<IPv4AddressRange | IPv6AddressRange>
): string {
  return ranges
    .map(x => x.toString())
    .join(';')
}

export function getRuleList(profile: IProfile): IRule[] {
  return profile.ProxifierProfile.RuleList[0].Rule
}

export function mergeRuleList(oldRuleList: IRule[], newRuleList: IRule[]): IRule[] {
  const defaultRule = last(oldRuleList)

  return oldRuleList
    .filter(isntProgramCreated)
    .filter(isnt(defaultRule))
    .concat(newRuleList)
    .concat([defaultRule])

  function isntProgramCreated(x: IRule): boolean {
    return !x.Name[0].includes(getProgramCreatedFlag())
  }

  function isnt(val: IRule): (val: IRule) => boolean {
    return (x: IRule) => x !== val
  }

  function last<T>(xs: T[]): T {
    return xs[xs.length - 1]
  }
}

export function createDirectRules(targets: string): IRule[] {
  const LIMIT_PER_RULE = 32767

  const group = splitStringAccordingToLengthAndDelimiter(targets, LIMIT_PER_RULE, ';')

  return group.map(rule => createDirectRule('directips', rule))

  function createDirectRule(prefix: string, target: string): IRule {
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

function replaceRuleList(profile: IProfile, ruleList: IRule[]): IProfile {
  return produce(profile, (profile => {
    profile.ProxifierProfile.RuleList[0].Rule = ruleList
  }))
}

function getProgramCreatedFlag(): string {
  return '[program-created]'
}

function buildProfileXml(profile: IProfile): string {
  const builder = new xml2js.Builder()
  const xml = builder.buildObject(profile)

  // Proxifier 4 cannot parse HTML Entities
  return xml.replace(/&#xD;/g, '\r')
}
