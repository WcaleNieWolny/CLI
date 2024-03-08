import { appendFileSync, existsSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import process from 'node:process'
import { program } from 'commander'
import * as p from '@clack/prompts'
import { createSupabaseClient, useLogSnag, verifyUser } from './utils'
import { checkLatest } from './api/update'

interface Options {
  local: boolean
}

export async function login(apikey: string, options: Options, shouldExit = true) {
  if (shouldExit)
    p.intro(`Login to Capgo`)

  if (!apikey) {
    if (shouldExit) {
      p.log.error('Missing API key, you need to provide a API key to upload your bundle')
      program.error('')
    }
    return false
  }
  await checkLatest()
  // write in file .capgo the apikey in home directory
  try {
    const { local } = options
    const snag = useLogSnag()

    if (local) {
      if (!existsSync('.git')) {
        p.log.error('To use local you should be in a git repository')
        program.error('')
      }
      writeFileSync('.capgo', `${apikey}\n`)
      appendFileSync('.gitignore', '.capgo\n')
    }
    else {
      const userHomeDir = homedir()
      writeFileSync(`${userHomeDir}/.capgo`, `${apikey}\n`)
    }
    const supabase = await createSupabaseClient(apikey)
    const userId = await verifyUser(supabase, apikey, ['write', 'all', 'upload'])
    await snag.track({
      channel: 'user-login',
      event: 'User CLI login',
      icon: '✅',
      user_id: userId,
      notify: false,
    }).catch()
    p.log.success(`login saved into .capgo file in ${local ? 'local' : 'home'} directory`)
  }
  catch (e) {
    p.log.error(`Error while saving login`)
    process.exit(1)
  }
  if (shouldExit) {
    p.outro('Done ✅')
    process.exit()
  }
  return true
}

export async function loginCommand(apikey: string, options: Options) {
  login(apikey, options, true)
}
