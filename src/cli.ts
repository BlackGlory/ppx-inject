#!/usr/bin/env node
import { program } from 'commander'
import { pkgDirname, name, version, description } from '@utils/package.js'
import { downloadStatistics } from './download.js'
import { injectDirectRulesIntoProfile } from './inject.js'
import path from 'path'

interface IOptions {
  cc: string[]
}

process.title = name

program
  .name(name)
  .version(version)
  .description(description)
  .requiredOption(
    '--cc <cc...>'
  , 'ISO 3166 2-letter code of the organization to which the allocation or assignment was made.'
  )
  .arguments('<profile>')
  .action(async (profileFilename: string) => {
    const options = program.opts<IOptions>()
    const cc = getCC(options)

    const dataDirname = path.join(pkgDirname, 'data')
    const statisticsFilename = await downloadStatistics(dataDirname)
    await injectDirectRulesIntoProfile(statisticsFilename, cc, profileFilename)
  })
  .parse()

function getCC(options: IOptions): string[] {
  return options.cc
}
