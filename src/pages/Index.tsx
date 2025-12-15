import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/pages/Dashboard';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { toast } = useToast();

  const handleLogin = (username: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    
    // Simulate login - in production this would connect to Verracross
    setTimeout(() => {
      setIsLoading(false);
      if (username && password) {
        setIsAuthenticated(true);
        toast({
          title: "Welcome back! 🦉",
          description: "Successfully connected to your student portal",
        });
      } else {
        setError("Please enter valid credentials");
      }
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Signed out 👋",
      description: "See you next time!",
    });
  };

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <LoginForm 
      onLogin={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Index;
