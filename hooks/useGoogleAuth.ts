import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  clientId: string;
  redirectUri?: string;
}

interface AuthResult {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

export function useGoogleAuth(config: GoogleAuthConfig) {
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Configure the auth request
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  
  const redirectUri = config.redirectUri || AuthSession.makeRedirectUri({
    scheme: 'vibzworld',
    path: 'auth',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
      },
    },
    discovery
  );

  // Handle the auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response);
    } else if (response?.type === 'error') {
      setAuthResult({ error: response.error?.message || 'Authentication failed' });
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      setAuthResult({ error: 'Authentication cancelled' });
      setIsLoading(false);
    }
  }, [response]);

  const handleAuthSuccess = async (authResponse: AuthSession.AuthSessionResult) => {
    try {
      if (authResponse.type !== 'success') return;

      const { code } = authResponse.params;
      
      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: config.clientId,
          code,
          redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier || '',
          },
        },
        discovery
      );

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      
      const user = await userInfoResponse.json();

      setAuthResult({
        accessToken: tokenResponse.accessToken,
        idToken: tokenResponse.idToken,
        refreshToken: tokenResponse.refreshToken,
        user,
      });
    } catch (error) {
      console.error('Auth error:', error);
      setAuthResult({ error: 'Failed to complete authentication' });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    setAuthResult(null);
    
    try {
      await promptAsync({
        useProxy: Platform.OS === 'web',
        showInRecents: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthResult({ error: 'Failed to start authentication' });
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setAuthResult(null);
  };

  return {
    signIn,
    signOut,
    isLoading,
    authResult,
    isAuthenticated: !!authResult?.accessToken,
  };
}