import { IPv4AddressRange, IPv6AddressRange } from 'address-range'
import { promises as fs } from 'fs'
import * as xml2js from 'xml2js'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import { isEmptyArray, last } from 'extra-utils'
import { assert, isntEmptyArray } from '@blackglory/prelude'

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

export function getRuleList(profile: IProfile): IRule[] {
  return profile.ProxifierProfile.RuleList[0].Rule
}

export function mergeRuleList(oldRuleList: IRule[], newRuleList: IRule[]): IRule[] {
  const defaultRule = last(oldRuleList)

  return oldRuleList
    .filter(isntProgramCreated)
    .filter(rule => rule !== defaultRule)
    .concat(newRuleList)
    .concat(
      defaultRule
    ? [defaultRule]
    : []
    )

  function isntProgramCreated(x: IRule): boolean {
    return !x.Name[0].includes(getProgramCreatedFlag())
  }
}

export function createDirectRules(
  ipRanges: Array<IPv4AddressRange | IPv6AddressRange>
, maxLengthPerRule: number = 32767
): IRule[] {
  const delimiter = ';'
  const rules: IRule[] = []

  let targetsParts: string[] = []
  let targetsLength: number = 0
  for (const ipRange of ipRanges) {
    const ipRangeText = ipRange.toString()

    if (isEmptyArray(targetsParts)) {
      assert(
        ipRangeText.length <= maxLengthPerRule
      , `ipRangeText.length should less than or equal to ${maxLengthPerRule}`
      )

      targetsParts.push(ipRangeText)
      targetsLength += ipRangeText.length
    } else {
      if (targetsLength + delimiter.length + ipRangeText.length > maxLengthPerRule) {
        const targets = targetsParts.join(delimiter)
        const rule = createDirectRule('direct-ips', targets)
        rules.push(rule)

        assert(
          ipRangeText.length <= maxLengthPerRule
        , `ipRangeText.length should less than or equal to ${maxLengthPerRule}`
        )
        targetsParts = [ipRangeText]
        targetsLength = ipRangeText.length
      } else {
        targetsParts.push(ipRangeText)
        targetsLength += delimiter.length + ipRangeText.length
      }
    }
  }
  if (isntEmptyArray(targetsParts)) {
    const targets = targetsParts.join(delimiter)
    const rule = createDirectRule('direct-ips', targets)
    rules.push(rule)
  }

  return rules

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
