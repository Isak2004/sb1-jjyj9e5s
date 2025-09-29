import { useState } from 'react';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const signIn = async () => {
    setIsLoading(true);
    // Google OAuth functionality temporarily disabled due to dependency issues
    // This would need to be implemented with a working OAuth solution
    console.log('Google OAuth sign-in not available');
    setIsLoading(false);
  };

  const signOut = async () => {
    setUser(null);
  };

  return {
    signIn,
    signOut,
    isLoading,
    user,
  };
};