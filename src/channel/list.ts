import { program } from 'commander';
import { checkAppExistsAndHasPermission } from '../api/app';
import { getActiveChannels, displayChannels } from '../api/channels';
import { OptionsBase } from '../api/utils';
import { findSavedKey, getConfig, createSupabaseClient, verifyUser } from '../utils';

export const listChannels = async (appId: string, options: OptionsBase) => {
  options.apikey = options.apikey || findSavedKey()
  const config = await getConfig();
  appId = appId || config?.app?.appId

  if (!options.apikey) {
    program.error("Missing API key, you need to provide a API key to upload your bundle");
  }
  if (!appId) {
    program.error("Missing argument, you need to provide a appId, or be in a capacitor project");
  }
  const supabase = createSupabaseClient(options.apikey)

  const userId = await verifyUser(supabase, options.apikey, ['write', 'all']);
  // Check we have app access to this appId
  await checkAppExistsAndHasPermission(supabase, appId, options.apikey);

  console.log(`Querying available versions in Capgo`);

  // Check we have app access to this appId
  await checkAppExistsAndHasPermission(supabase, appId, options.apikey);

  // Get all active app versions we might possibly be able to cleanup
  const allVersions = await getActiveChannels(supabase, appId, userId);

  console.log(`Active channels in Capgo: ${allVersions?.length}`);

  displayChannels(allVersions);
  console.log(`Done ✅`);
  process.exit()
}