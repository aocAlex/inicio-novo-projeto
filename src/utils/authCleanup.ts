
export const cleanupAuthState = () => {
  console.log('Iniciando limpeza completa do estado de autenticação');
  
  // Remove todas as chaves relacionadas ao Supabase do localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('sb.')) {
      console.log('Removendo chave do localStorage:', key);
      localStorage.removeItem(key);
    }
  });

  // Remove também do sessionStorage se existir
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('sb.')) {
        console.log('Removendo chave do sessionStorage:', key);
        sessionStorage.removeItem(key);
      }
    });
  }

  // Remove outras chaves que podem estar relacionadas ao app
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

  console.log('Limpeza do estado de autenticação concluída');
};

export const forceAuthReset = async () => {
  console.log('Forçando reset completo da autenticação');
  
  // Limpar estado
  cleanupAuthState();
  
  // Forçar recarregamento da página para garantir estado limpo
  setTimeout(() => {
    window.location.href = '/auth';
  }, 100);
};
