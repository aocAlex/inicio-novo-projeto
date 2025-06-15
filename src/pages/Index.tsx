
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index page - user:', !!user, 'loading:', loading);
    
    if (!loading) {
      if (user) {
        console.log('User authenticated, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('User not authenticated, redirecting to auth');
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
        <p className="text-muted-foreground">Verificando seu acesso</p>
      </div>
    </div>
  );
};

export default Index;
