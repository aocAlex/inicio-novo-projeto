
export const cleanupAuthState = () => {
  console.log('Starting complete auth state cleanup');
  
  // Remove all Supabase-related keys from localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('sb.')) {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });

  // Remove from sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('sb.')) {
        console.log('Removing sessionStorage key:', key);
        sessionStorage.removeItem(key);
      }
    });
  }

  // Remove other app-related keys
  const keysToRemove = [
    'workspace_id',
    'current_workspace',
    'user_profile',
    'auth_token',
    'refresh_token'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  });

  console.log('Auth state cleanup completed');
};

export const forceAuthReset = async () => {
  console.log('Forcing complete auth reset');
  
  // Clean up state
  cleanupAuthState();
  
  // Force page reload to ensure clean state
  setTimeout(() => {
    window.location.href = '/auth';
  }, 100);
};
