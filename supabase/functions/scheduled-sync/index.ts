import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function runs on a schedule to sync all users with auto_sync_enabled
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting scheduled sync for all users...');

    // Get all users with auto_sync_enabled
    const { data: syncStatuses, error } = await supabase
      .from('sync_status')
      .select('user_id, auto_sync_enabled')
      .eq('auto_sync_enabled', true);

    if (error) {
      console.error('Error fetching sync statuses:', error);
      throw error;
    }

    const usersToSync = syncStatuses || [];
    console.log(`Found ${usersToSync.length} users with auto-sync enabled`);

    const results: any[] = [];

    for (const status of usersToSync) {
      try {
        console.log(`Syncing user: ${status.user_id}`);
        
        // Call the verracross-sync function for this user
        const response = await fetch(`${supabaseUrl}/functions/v1/verracross-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: 'scheduled_sync',
            userId: status.user_id,
          }),
        });

        const result = await response.json();
        results.push({
          userId: status.user_id,
          success: result.success,
          changesFound: result.changesFound || 0,
        });

        console.log(`User ${status.user_id} sync complete:`, result.success ? 'success' : 'failed');
      } catch (userError) {
        console.error(`Error syncing user ${status.user_id}:`, userError);
        results.push({
          userId: status.user_id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        });
      }
    }

    console.log('Scheduled sync completed for all users');

    return new Response(
      JSON.stringify({ 
        success: true, 
        usersProcessed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
