// Placeholder for Google Auth hook - dependencies not available
export const useGoogleAuth = () => {
  return {
    request: null,
    response: null,
    promptAsync: () => Promise.resolve({ type: 'cancel' }),
    loading: false,
    error: null
  };
};