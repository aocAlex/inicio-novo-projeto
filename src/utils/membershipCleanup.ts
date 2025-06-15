
import { supabase } from '@/integrations/supabase/client';

interface SimpleMember {
  id: string;
  user_id: string;
}

interface SimpleProfile {
  id: string;
}

export const cleanupOrphanedMembers = async (workspaceId: string) => {
  try {
    console.log('Starting cleanup of orphaned members for workspace:', workspaceId);

    // Get all active members for this workspace
    const membersResult = await supabase
      .from('workspace_members')
      .select('id, user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (membersResult.error) {
      console.error('Error fetching all members:', membersResult.error);
      return { success: false, error: membersResult.error };
    }

    const allMembers = membersResult.data as SimpleMember[];

    if (!allMembers || allMembers.length === 0) {
      console.log('No active members found');
      return { success: true, removedCount: 0 };
    }

    // Check which members have valid profiles
    const orphanedMembers: SimpleMember[] = [];
    
    for (const member of allMembers) {
      // Check if profile exists
      const profileResult = await supabase
        .from('profiles')
        .select('id')
        .eq('id', member.user_id)
        .single();

      if (profileResult.error || !profileResult.data) {
        orphanedMembers.push(member);
      }
    }

    console.log(`Found ${orphanedMembers.length} orphaned members out of ${allMembers.length} total`);

    if (orphanedMembers.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Suspend orphaned members
    const orphanedIds = orphanedMembers.map(m => m.id);
    
    const updateResult = await supabase
      .from('workspace_members')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .in('id', orphanedIds);

    if (updateResult.error) {
      console.error('Error suspending orphaned members:', updateResult.error);
      return { success: false, error: updateResult.error };
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
    // Check if profile exists
    const profileResult = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileResult.error || !profileResult.data) {
      console.error('Error validating user:', profileResult.error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
