
import { supabase } from '@/integrations/supabase/client';

interface MemberRecord {
  id: string;
  user_id: string;
}

interface ProfileRecord {
  id: string;
}

export const cleanupOrphanedMembers = async (workspaceId: string) => {
  try {
    console.log('Starting cleanup of orphaned members for workspace:', workspaceId);

    // Get all members for this workspace (no status column exists)
    const { data: allMembers, error: membersError } = await supabase
      .from('workspace_members')
      .select('id, user_id')
      .eq('workspace_id', workspaceId);

    if (membersError) {
      console.error('Error fetching all members:', membersError);
      return { success: false, error: membersError };
    }

    if (!allMembers || allMembers.length === 0) {
      console.log('No members found');
      return { success: true, removedCount: 0 };
    }

    // Check which members have valid profiles
    const orphanedMembers: MemberRecord[] = [];
    
    for (const member of allMembers) {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', member.user_id)
        .single();

      if (profileError || !profile) {
        orphanedMembers.push(member as MemberRecord);
      }
    }

    console.log(`Found ${orphanedMembers.length} orphaned members out of ${allMembers.length} total`);

    if (orphanedMembers.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Delete orphaned members instead of suspending (since no status column)
    const orphanedIds = orphanedMembers.map(m => m.id);
    
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .in('id', orphanedIds);

    if (deleteError) {
      console.error('Error deleting orphaned members:', deleteError);
      return { success: false, error: deleteError };
    }

    console.log(`Successfully deleted ${orphanedMembers.length} orphaned members`);
    return { success: true, removedCount: orphanedMembers.length };

  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
    return { success: false, error };
  }
};

export const validateMemberExists = async (userId: string): Promise<boolean> => {
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error validating user:', profileError);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
