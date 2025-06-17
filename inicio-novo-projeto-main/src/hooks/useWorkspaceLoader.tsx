
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
      return workspaceData;
    } catch (error) {
      console.error('Error in createDefaultWorkspace:', error);
      throw error;
    }
  }, []);

  const loadWorkspaces = useCallback(async (userId: string, userEmail: string) => {
    console.log('Loading workspaces for user:', userId);
    
    try {
      setError(null);
      
      // First, get workspaces the user owns
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) {
        console.error('Error loading owned workspaces:', ownedError);
        throw ownedError;
      }

      // Then get workspaces where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id, invited_by, joined_at, created_at, updated_at, id,
          workspace:workspaces(*)
        `)
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error loading member data:', memberError);
        throw memberError;
      }

      console.log('Owned workspaces:', ownedWorkspaces);
      console.log('Member data:', memberData);

      // Combine owned workspaces with member workspaces
      const allWorkspaces: Workspace[] = [...(ownedWorkspaces || [])];
      
      // Add member workspaces that aren't already owned
      if (memberData) {
        memberData.forEach((member: any) => {
          if (member.workspace && !allWorkspaces.find(w => w.id === member.workspace.id)) {
            allWorkspaces.push(member.workspace);
          }
        });
      }

      // If no workspaces found, create a default one
      if (allWorkspaces.length === 0) {
        console.log('No workspaces found, creating default workspace');
        const defaultWorkspace = await createDefaultWorkspace(userId, userEmail);
        
        return { 
          workspaces: [defaultWorkspace], 
          memberData: [{
            id: 'temp-id',
            workspace_id: defaultWorkspace.id,
            user_id: userId,
            invited_by: null,
            joined_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        };
      }

      // Create member data for all workspaces
      const enrichedMemberData = allWorkspaces.map(workspace => {
        // Check if user is owner
        if (workspace.owner_id === userId) {
          return {
            id: `owner-${workspace.id}`,
            workspace_id: workspace.id,
            user_id: userId,
            invited_by: null,
            joined_at: workspace.created_at,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at
          };
        }
        
        // Find member data
        const memberInfo = memberData?.find((m: any) => m.workspace_id === workspace.id);
        return memberInfo ? {
          id: memberInfo.id,
          workspace_id: memberInfo.workspace_id,
          user_id: userId,
          invited_by: memberInfo.invited_by,
          joined_at: memberInfo.joined_at,
          created_at: memberInfo.created_at,
          updated_at: memberInfo.updated_at
        } : null;
      }).filter(Boolean);

      console.log('Found workspaces:', allWorkspaces.length);
      
      return { workspaces: allWorkspaces, memberData: enrichedMemberData };

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
  }, [toast, createDefaultWorkspace]);

  return {
    loadWorkspaces,
    error,
    setError
  };
};
