
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useWorkspaceLoader = () => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const createDefaultWorkspace = useCallback(async (userId: string, userEmail: string) => {
    console.log('Creating default workspace for user:', userId);
    
    try {
      // Create workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: `Workspace de ${userEmail.split('@')[0]}`,
          description: 'Workspace criada automaticamente',
          owner_id: userId,
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError);
        throw workspaceError;
      }

      console.log('Workspace created successfully:', workspaceData);

      // Create membership
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: userId,
          role: 'owner',
          status: 'active',
        });

      if (memberError) {
        console.error('Error creating membership:', memberError);
        throw memberError;
      }

      console.log('Membership created successfully for workspace:', workspaceData.id);
      return workspaceData;
    } catch (error) {
      console.error('Error in createDefaultWorkspace:', error);
      throw error;
    }
  }, []);

  const addUserToPublicWorkspaces = useCallback(async (userId: string) => {
    console.log('Adding user to public workspaces:', userId);
    
    try {
      // Get all public workspaces
      const { data: publicWorkspaces, error: fetchError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('is_public', true);

      if (fetchError) {
        console.error('Error fetching public workspaces:', fetchError);
        return;
      }

      if (!publicWorkspaces || publicWorkspaces.length === 0) {
        console.log('No public workspaces found');
        return;
      }

      // Add user to each public workspace as viewer
      const memberships = publicWorkspaces.map(workspace => ({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'viewer' as const,
        status: 'active' as const,
      }));

      const { error: insertError } = await supabase
        .from('workspace_members')
        .upsert(memberships, { 
          onConflict: 'workspace_id,user_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Error adding user to public workspaces:', insertError);
      } else {
        console.log('Successfully added user to public workspaces');
      }
    } catch (error) {
      console.error('Error in addUserToPublicWorkspaces:', error);
    }
  }, []);

  const loadWorkspaces = useCallback(async (userId: string, userEmail: string) => {
    console.log('Loading workspaces for user:', userId);
    
    try {
      setError(null);
      
      // First, ensure user is added to public workspaces
      await addUserToPublicWorkspaces(userId);
      
      // Get the user's workspaces (including public ones they're now a member of)
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, status, permissions, last_activity, created_at, id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) {
        console.error('Error loading member data:', memberError);
        throw memberError;
      }

      console.log('Member data loaded:', memberData);

      // If no workspaces found, create a default one
      if (!memberData || memberData.length === 0) {
        console.log('No workspace memberships found, creating default workspace');
        
        const defaultWorkspace = await createDefaultWorkspace(userId, userEmail);
        
        // Return the newly created workspace
        return { 
          workspaces: [defaultWorkspace], 
          memberData: [{
            id: 'temp-id',
            workspace_id: defaultWorkspace.id,
            user_id: userId,
            role: 'owner' as const,
            status: 'active' as const,
            permissions: {},
            last_activity: null,
            created_at: new Date().toISOString()
          }]
        };
      }

      // Get workspace details separately
      const workspaceIds = memberData.map(m => m.workspace_id);
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (workspaceError) {
        console.error('Error loading workspace data:', workspaceError);
        throw workspaceError;
      }

      // Map the data together
      const enrichedMemberData = memberData.map(member => {
        const workspace = workspaceData?.find(w => w.id === member.workspace_id);
        return {
          ...member,
          workspace
        };
      }).filter(member => member.workspace);

      const userWorkspaces = enrichedMemberData.map(member => member.workspace).filter(Boolean);
      
      console.log('Found workspaces:', userWorkspaces.length);
      
      return { workspaces: userWorkspaces, memberData: enrichedMemberData };

    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar workspaces: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, createDefaultWorkspace, addUserToPublicWorkspaces]);

  return {
    loadWorkspaces,
    error,
    setError
  };
};
