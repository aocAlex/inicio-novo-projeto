
import { WorkspaceMember } from '@/types/workspace';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export const createMemberWithProfile = (
  memberData: any,
  profile: Profile
): WorkspaceMember => {
  return {
    id: memberData.id,
    workspace_id: memberData.workspace_id,
    user_id: memberData.user_id,
    role: ['owner', 'admin', 'editor', 'viewer'].includes(memberData.role) 
      ? memberData.role as 'owner' | 'admin' | 'editor' | 'viewer'
      : 'viewer',
    permissions: memberData.permissions && typeof memberData.permissions === 'object' && !Array.isArray(memberData.permissions)
      ? memberData.permissions as Record<string, any>
      : {},
    status: ['active', 'pending', 'suspended'].includes(memberData.status) 
      ? memberData.status as 'active' | 'pending' | 'suspended'
      : 'active',
    last_activity: memberData.last_activity,
    created_at: memberData.created_at,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url
    }
  };
};
