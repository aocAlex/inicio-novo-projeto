
import { supabase } from '@/integrations/supabase/client';

export const cleanupOrphanedMembers = async (workspaceId: string) => {
  try {
    console.log('Starting cleanup of orphaned members for workspace:', workspaceId);

    // Buscar todos os membros do workspace
    const { data: allMembers, error: membersError } = await supabase
      .from('workspace_members')
      .select('id, user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (membersError) {
      console.error('Error fetching workspace members:', membersError);
      return { success: false, error: membersError };
    }

    if (!allMembers || allMembers.length === 0) {
      console.log('No members found for workspace');
      return { success: true, removedCount: 0 };
    }

    // Verificar quais membros têm profiles válidos
    const userIds = allMembers.map(m => m.user_id);
    const { data: validProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { success: false, error: profilesError };
    }

    const validUserIds = new Set(validProfiles?.map(p => p.id) || []);
    const orphanedMembers = allMembers.filter(member => !validUserIds.has(member.user_id));

    console.log(`Found ${orphanedMembers.length} orphaned members out of ${allMembers.length} total`);

    if (orphanedMembers.length === 0) {
      return { success: true, removedCount: 0 };
    }

    // Remover membros órfãos (suspender status)
    const orphanedIds = orphanedMembers.map(m => m.id);
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ status: 'suspended' })
      .in('id', orphanedIds);

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
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
};
