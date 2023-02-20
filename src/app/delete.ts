import { program } from "commander";
import { OptionsBase } from "../api/utils";
import { checkAppExistsAndHasPermission } from '../api/app';
import { createSupabaseClient, findSavedKey, formatError, getConfig, useLogSnag, verifyUser } from "../utils";

export const deleteApp = async (appId: string, userId: string, options: OptionsBase) => {
    options.apikey = options.apikey || findSavedKey() || ''
    const config = await getConfig();
    appId = appId || config?.app?.appId
    const snag = useLogSnag()

    if (!options.apikey) {
        program.error("Missing API key, you need to provide a API key to upload your bundle");
    }
    if (!appId) {
        program.error("Missing argument, you need to provide a appId, or be in a capacitor project");
    }
    const supabase = createSupabaseClient(options.apikey)

    await verifyUser(supabase, options.apikey, ['write', 'all']);
    // Check we have app access to this appId
    await checkAppExistsAndHasPermission(supabase, appId, options.apikey);

    const { error } = await supabase
        .storage
        .from(`images/${userId}`)
        .remove([appId])
    if (error) {
        program.error(`Could not add app ${formatError(error)}`);
    }
    const { error: delError } = await supabase
        .storage
        .from(`apps/${appId}/${userId}`)
        .remove(['versions'])
    if (delError) {
        program.error(`Could not delete app version ${formatError(delError)}`);
    }

    const { error: dbError } = await supabase
        .from('apps')
        .delete()
        .eq('app_id', appId)
        .eq('user_id', userId)

    if (dbError) {
        program.error(`Could not delete app ${formatError(dbError)}`);
    }
    await snag.publish({
        channel: 'app',
        event: 'App Deleted',
        icon: '🗑️',
        tags: {
            'user-id': userId,
            'app-id': appId,
        },
        notify: false,
    }).catch()
    console.log("App deleted in Capgo")
    console.log(`Done ✅`);
    process.exit()
}