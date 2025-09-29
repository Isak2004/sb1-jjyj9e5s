import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  accessToken?: string;
  idToken?: string;
  user?: any;
  error?: string;
}

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  isLoading: boolean;
  error: string | null;
}

const GOOGLE_CLIENT_ID = '130221165582-8nbialqq6t9vhefs5iu8hqos0b31inhg.apps.googleusercontent.com';

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the auth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'vibzworld',
        path: 'auth',
      }),
      codeChallenge: '',
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
      },
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    }
  );

  // Generate code challenge for PKCE
  useEffect(() => {
    const generateCodeChallenge = async () => {
      if (request) {
        const codeVerifier = AuthSession.AuthRequest.createRandomCodeChallenge();
        const codeChallenge = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          codeVerifier,
          { encoding: Crypto.CryptoEncoding.BASE64URL }
        );
        
        request.codeChallenge = codeChallenge;
        request.codeVerifier = codeVerifier;
      }
    };

    generateCodeChallenge();
  }, [request]);

  // Handle the auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response);
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Authentication failed');
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      setError('Authentication was cancelled');
      setIsLoading(false);
    }
  }, [response]);

  const handleAuthSuccess = async (authResponse: AuthSession.AuthSessionResult) => {
    try {
      if (authResponse.type !== 'success' || !authResponse.params.code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          code: authResponse.params.code,
          redirectUri: AuthSession.makeRedirectUri({
            scheme: 'vibzworld',
            path: 'auth',
          }),
          codeVerifier: request?.codeVerifier,
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
      );

      if (tokenResponse.accessToken) {
        // Get user info
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        setIsLoading(false);
        return {
          accessToken: tokenResponse.accessToken,
          idToken: tokenResponse.idToken,
          user: userInfo,
        };
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsLoading(false);
      return { error: errorMessage };
    }
  };

  const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!request) {
        throw new Error('Auth request not initialized');
      }

      const result = await promptAsync({
        useProxy: Platform.OS === 'web',
        showInRecents: true,
      });

      if (result.type === 'success') {
        return await handleAuthSuccess(result);
      } else if (result.type === 'cancel') {
        setIsLoading(false);
        return { error: 'Authentication was cancelled' };
      } else {
        setIsLoading(false);
        return { error: 'Authentication failed' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsLoading(false);
      return { error: errorMessage };
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    error,
  };
}