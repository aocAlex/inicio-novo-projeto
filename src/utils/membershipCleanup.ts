
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceMember {
  id: string;
  user_id: string;
}

interface ProfileCheck {
  id: string;
}

export const cleanupOrphanedMembers = async (workspaceId: string) => {
  try {
    console.log('Starting cleanup of orphaned members for workspace:', workspaceId);

    // Get all active members for this workspace
    const membersQuery = supabase
      .from('workspace_members')
      .select('id, user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    const { data: allMembers, error: allMembersError } = await membersQuery;

    if (allMembersError) {
      console.error('Error fetching all members:', allMembersError);
      return { success: false, error: allMembersError };
    }

    if (!allMembers || allMembers.length === 0) {
      console.log('No active members found');
      return { success: true, removedCount: 0 };
    }

    // Check which members have valid profiles
    const orphanedMembers: WorkspaceMember[] = [];
    
    for (const member of allMembers) {
      const profileQuery = supabase
        .from('profiles')
        .select('id')
        .eq('id', member.user_id)
        .single();

      const { data: profile, error: profileError } = await profileQuery;

      if (profileError || !profile) {
        orphanedMembers.push(member);
      }
    }

    console.log(`Found ${orphanedMembers.length} orphaned members out of ${allMembers.length} total`);

    if (orphanedMembers.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Suspend orphaned members
    const orphanedIds = orphanedMembers.map(m => m.id);
    
    const updateQuery = supabase
      .from('workspace_members')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .in('id', orphanedIds);

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error suspending orphaned members:', updateError);
      return { success: false, error: updateError };
    }

    console.log(`Successfully suspended ${orphanedMembers.length} orphaned members`);
    return { success: true, removedCount: orphanedMembers.length };

  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
    return { success: false, error };
  }
};

export const validateMemberExists = async (userId: string): Promise<boolean> => {
  try {
    const profileQuery = supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    const { data, error } = await profileQuery;

    if (error || !data) {
      console.error('Error validating user:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
