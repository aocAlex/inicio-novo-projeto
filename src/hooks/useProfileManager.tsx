
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/workspace';

interface UseProfileManagerProps {
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProfileManager = ({ setProfile, setLoading }: UseProfileManagerProps) => {
  
  const parsePreferences = (preferences: any) => {
    const prefs = preferences && typeof preferences === 'object' 
      ? preferences 
      : { notifications: true, email_alerts: true, theme: 'light' };

    return {
      notifications: prefs.notifications ?? true,
      email_alerts: prefs.email_alerts ?? true,
      theme: (prefs.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'
    };
  };

  const ensureProfileExists = useCallback(async (userId: string, userEmail: string, metadata?: any): Promise<Profile | null> => {
    try {
      console.log('Checking profile for userId:', userId);
      
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('Profile found:', existingProfile.id);
        const convertedProfile: Profile = {
          ...existingProfile,
          preferences: parsePreferences(existingProfile.preferences)
        };
        return convertedProfile;
      }

      // Create new profile if none exists
      console.log('Creating new profile for user:', userId);
      const profileData = {
        id: userId,
        email: userEmail,
        full_name: metadata?.full_name || userEmail.split('@')[0],
        preferences: {
          notifications: true,
          email_alerts: true,
          theme: 'light'
        }
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        
        // Handle duplicate key error by fetching existing profile
        if (createError.code === '23505') {
          const { data: duplicateProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (duplicateProfile) {
            const convertedProfile: Profile = {
              ...duplicateProfile,
              preferences: parsePreferences(duplicateProfile.preferences)
            };
            return convertedProfile;
          }
        }
        throw createError;
      }

      console.log('New profile created successfully:', newProfile.id);
      const convertedProfile: Profile = {
        ...newProfile,
        preferences: parsePreferences(newProfile.preferences)
      };
      return convertedProfile;
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (userId: string, userEmail: string, metadata?: any) => {
    try {
      console.log('Loading user data:', userId);
      
      const profileData = await ensureProfileExists(userId, userEmail, metadata);
      
      if (profileData) {
        setProfile(profileData);
        console.log('Profile loaded successfully:', profileData.id);
      } else {
        console.warn('Failed to load/create profile, setting null');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [ensureProfileExists, setProfile, setLoading]);

  const updateProfile = useCallback(async (userId: string, data: Partial<Profile>) => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
    
    // Get current profile and merge with new data
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (updatedProfile) {
      const convertedProfile: Profile = {
        ...updatedProfile,
        preferences: parsePreferences(updatedProfile.preferences)
      };
      setProfile(convertedProfile);
    }
  }, [setProfile]);

  return {
    loadUserData,
    updateProfile
  };
};
