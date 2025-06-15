
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
    invited_by: memberData.invited_by,
    joined_at: memberData.joined_at,
    created_at: memberData.created_at,
    updated_at: memberData.updated_at,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url
    }
  };
};
