import { supabase } from './client';

/**
 * Initialize and fix RLS policies on first app load
 * This function attempts to fix the RLS policy issue preventing question creation
 */
export async function initializeRLSPolicies() {
  try {
    console.log('Attempting to initialize RLS policies...');

    // First try: Call the stored procedure if it exists
    try {
      const { data, error } = await (supabase as any).rpc('fix_rls_policies', {});

      if (!error && data) {
        console.log('✓ RLS policies fixed via stored procedure:', data);
        return true;
      } else if (error) {
        console.log('Stored procedure call result:', error.message);
      }
    } catch (err) {
      console.log('Stored procedure not available, will try alternative methods');
    }

    // Second try: Call via explicit function call with auth
    try {
      const session = await supabase.auth.getSession();
      if (session.data.session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (data.session) {
          const result = await (supabase as any).rpc('fix_rls_policies', {}, {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          });

          if (!result.error) {
            console.log('✓ RLS policies fixed with auth token');
            return true;
          }
        }
      }
    } catch (authErr) {
      console.log('Auth attempt failed');
    }

    // If all auto-fixes fail, log what needs to be done
    console.log(
      '⚠️  Could not auto-initialize RLS policies. ' +
      'The stored procedure fix_rls_policies() needs to be deployed via Supabase dashboard.'
    );

    return false;
  } catch (error) {
    console.error('Error during RLS policy initialization:', error);
    return false;
  }
}
