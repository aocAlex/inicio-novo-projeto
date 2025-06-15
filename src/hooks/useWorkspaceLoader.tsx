
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
          workspace_id, role, status, permissions, last_activity, created_at, id,
          workspace:workspaces(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) {
        console.error('Error loading member data:', memberError);
        throw memberError;
      }

      console.log('Owned workspaces:', ownedWorkspaces);
      console.log('Member data:', memberData);

      // Combine owned workspaces with member workspaces
      const allWorkspaces: Workspace[] = [...(ownedWorkspaces || [])];
      const memberWorkspaces = memberData?.map(m => m.workspace).filter(Boolean) || [];
      
      // Add member workspaces that aren't already owned
      memberWorkspaces.forEach(workspace => {
        if (!allWorkspaces.find(w => w.id === workspace.id)) {
          allWorkspaces.push(workspace);
        }
      });

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
            role: 'owner' as const,
            status: 'active' as const,
            permissions: {},
            last_activity: null,
            created_at: new Date().toISOString()
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
            role: 'owner' as const,
            status: 'active' as const,
            permissions: {},
            last_activity: null,
            created_at: new Date().toISOString(),
            workspace
          };
        }
        
        // Find member data
        const memberInfo = memberData?.find(m => m.workspace_id === workspace.id);
        return {
          ...memberInfo,
          workspace
        };
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
