import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager'; // Added import

export const useWorkspaceLoader = () => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { createWorkspace } = useWorkspaceManager(); // Call hook at the top level

  const loadWorkspaces = useCallback(async (userId: string, userEmail: string) => {
    console.log('Loading workspaces for user:', userId);

    try {
      setError(null);

      // First, get workspaces the user owns
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_active', true); // Added filter for active workspaces

      if (ownedError) {
        console.error('Error loading owned workspaces:', ownedError);
        throw ownedError;
      }

      // Then get workspaces where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id, invited_by, joined_at, created_at, updated_at, id,
          workspace:workspaces(*) // Reverted to select all columns
        `)
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error loading member data:', memberError);
        throw memberError;
      }

      console.log('Owned workspaces:', ownedWorkspaces);
      console.log('Member data:', memberData);

      // Combine owned workspaces with member workspaces
      let allWorkspaces: Workspace[] = [...(ownedWorkspaces || [])]; // Use let to allow reassigning

      // Add member workspaces that aren't already owned
      if (memberData) {
        memberData.forEach((member: any) => {
          // Ensure member.workspace is active before adding
          if (member.workspace && member.workspace.is_active && !allWorkspaces.find(w => w.id === member.workspace.id)) { // Added is_active check
            allWorkspaces.push(member.workspace);
          }
        });
      }

      // Filter out any inactive workspaces that might have been added (e.g., if owned but inactive)
      allWorkspaces = allWorkspaces.filter(workspace => workspace.is_active); // Explicit frontend filter

      // If no active workspaces found, create a default one
      if (allWorkspaces.length === 0) {
        console.log('No active workspaces found, creating default workspace'); // Updated log message
        // Use the createWorkspace function from useWorkspaceManager
        const defaultWorkspace = await createWorkspace({ name: `Workspace de ${userEmail.split('@')[0]}`, description: 'Workspace criada automaticamente' }, userId);

        // The createWorkspace function already handles adding the user as a member and setting current_workspace_id
        // We just need to return the created workspace and its member data
        return {
          workspaces: [defaultWorkspace],
          memberData: [{ // Construct member data for the newly created workspace
            id: `owner-${defaultWorkspace.id}`, // Use a consistent ID pattern
            workspace_id: defaultWorkspace.id,
            user_id: userId,
            invited_by: null, // Assuming no inviter for default workspace
            joined_at: defaultWorkspace.created_at, // Use workspace creation time
            created_at: defaultWorkspace.created_at,
            updated_at: defaultWorkspace.updated_at
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
  }, [toast, createWorkspace]); // Added createWorkspace to dependency array

  return {
    loadWorkspaces,
    error,
    setError
  };
};
