import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface PlatformWebViewProps {
  source: { uri: string };
  style?: any;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onNavigationStateChange?: (navState: any) => void;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
  bounces?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  ref?: React.RefObject<any>;
  onGoogleAuthRequest?: () => void;
  onGoogleAuthRequest?: () => void;
}

// Web-specific WebView component using iframe with complete fullscreen support
const WebWebView = React.forwardRef<HTMLIFrameElement, PlatformWebViewProps>(
  ({ source, style, onLoadStart, onLoadEnd, onError, onNavigationStateChange, onGoogleAuthRequest, ...props }, ref) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = React.useState(source.uri);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Listen for messages from the iframe
    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from our domain
        if (event.origin !== 'https://enter.vibz.world') return;
        
        if (event.data?.type === 'GOOGLE_AUTH_REQUEST') {
          onGoogleAuthRequest?.();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onGoogleAuthRequest]);

    // Listen for messages from the iframe
    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from our domain
        if (event.origin !== 'https://enter.vibz.world') return;
        
        if (event.data?.type === 'GOOGLE_AUTH_REQUEST') {
          onGoogleAuthRequest?.();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onGoogleAuthRequest]);

    React.useImperativeHandle(ref, () => ({
      reload: () => {
        if (iframeRef.current) {
          setLoading(true);
          setError(null);
          iframeRef.current.src = currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_reload=' + Date.now();
        }
      },
      postMessage: (message: any) => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, 'https://enter.vibz.world');
        }
      },
      postMessage: (message: any) => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, 'https://enter.vibz.world');
        }
      },
      goBack: () => {
        console.log('Go back functionality limited in web iframe');
      },
      goForward: () => {
        console.log('Go forward functionality limited in web iframe');
      },
    }));

    const enterFullscreen = async () => {
      try {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any)?.mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any)?.msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
      }
    };

    const handleLoad = () => {
      setLoading(false);
      setError(null);
      onLoadEnd?.();
      
      // Automatically enter fullscreen when website loads
      setTimeout(() => {
        enterFullscreen();
      }, 800);
      
      onNavigationStateChange?.({
        url: currentUrl,
        canGoBack: false,
        canGoForward: false,
        loading: false,
      });
    };

    const handleLoadStart = () => {
      setLoading(true);
      setError(null);
      onLoadStart?.();
    };

    const handleError = () => {
      setLoading(false);
      setError('This website cannot be displayed in the browser due to security restrictions. Try opening it in a new tab.');
      onError?.({ nativeEvent: { description: 'Failed to load page - X-Frame-Options restriction' } });
    };

    const openInNewTab = () => {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    };

    React.useEffect(() => {
      setCurrentUrl(source.uri);
      setLoading(true);
      setError(null);
    }, [source.uri]);

    if (error) {
      return (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa' }, style]}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#dc3545', marginBottom: 12, textAlign: 'center' }}>
            Cannot Display Website
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            {error}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <button
              onClick={openInNewTab}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Open in New Tab
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </View>
        </View>
      );
    }

    return (
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          ...style 
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            color: '#fff',
            zIndex: 1,
          }}>
            <div style={{
              width: 50,
              height: 50,
              border: '4px solid #333',
              borderTop: '4px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: 20,
            }} />
            <div style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Loading website...</div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 300 }}>
              Will automatically enter fullscreen mode for immersive browsing
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={source.uri}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: loading ? 'none' : 'block',
          }}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation allow-top-navigation-by-user-activation"
          allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; vr; xr-spatial-tracking; fullscreen"
          loading="lazy"
          title="Web Browser Content"
          allowFullScreen
        />
      </div>
    );
  }
);

// Main PlatformWebView component
const PlatformWebView = React.forwardRef<any, PlatformWebViewProps>((props, ref) => {
  const { signInWithGoogle, isLoading: authLoading } = useGoogleAuth();
  const webViewRef = React.useRef<any>(null);

  // Handle Google Auth request from WebView
  const handleGoogleAuthRequest = async () => {
    try {
      const result = await signInWithGoogle();
      
      // Send the result back to the WebView
      const message = {
        type: 'GOOGLE_AUTH_RESPONSE',
        success: !result.error,
        data: result.error ? { error: result.error } : {
          accessToken: result.accessToken,
          idToken: result.idToken,
          user: result.user,
        },
      };

      if (Platform.OS === 'web') {
        webViewRef.current?.postMessage(message);
      } else {
        webViewRef.current?.postMessage(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Google Auth error:', error);
    }
  };

  // Inject JavaScript to handle communication and detect mobile app
  const injectedJavaScript = `
    (function() {
      // Set custom user agent identifier
      Object.defineProperty(navigator, 'userAgent', {
        get: function() { return navigator.userAgent + ' VibzWorldApp/1.0'; }
      });

      // Listen for messages from React Native
      window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'string') {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'GOOGLE_AUTH_RESPONSE') {
              // Dispatch custom event that your web app can listen to
              window.dispatchEvent(new CustomEvent('googleAuthResponse', { detail: message }));
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        } else if (event.data && event.data.type === 'GOOGLE_AUTH_RESPONSE') {
          // For web platform (direct object)
          window.dispatchEvent(new CustomEvent('googleAuthResponse', { detail: event.data }));
        }
      });

      // Function to request Google Auth (your web app should call this)
      window.requestGoogleAuth = function() {
        if (window.ReactNativeWebView) {
          // Mobile platform
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GOOGLE_AUTH_REQUEST' }));
        } else if (window.parent !== window) {
          // Web platform (iframe)
          window.parent.postMessage({ type: 'GOOGLE_AUTH_REQUEST' }, 'https://enter.vibz.world');
        }
      };

      // Detect if running in mobile app
      window.isVibzWorldApp = true;
      
      true; // Required for injected JavaScript
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const message = Platform.OS === 'web' ? event.data : JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'GOOGLE_AUTH_REQUEST') {
        handleGoogleAuthRequest();
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  if (Platform.OS === 'web') {
    return <WebWebView {...props} ref={ref} onGoogleAuthRequest={handleGoogleAuthRequest} />;
  }

  // For mobile platforms, use react-native-webview
  return (
    <WebView
      {...props}
      ref={(ref) => {
        webViewRef.current = ref;
        if (typeof props.ref === 'function') {
          props.ref(ref);
        } else if (props.ref) {
          props.ref.current = ref;
        }
      }}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleMessage}
      userAgent="VibzWorldApp/1.0"
      mixedContentMode="compatibility"
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
    />
  );
});

export default PlatformWebView;