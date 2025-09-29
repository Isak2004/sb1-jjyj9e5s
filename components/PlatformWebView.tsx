import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

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
}

// Web-specific WebView component using iframe with complete fullscreen support
const WebWebView = React.forwardRef<HTMLIFrameElement, PlatformWebViewProps>(
  ({ source, style, onLoadStart, onLoadEnd, onError, onNavigationStateChange, ...props }, ref) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = React.useState(source.uri);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => ({
      reload: () => {
        if (iframeRef.current) {
          setLoading(true);
          setError(null);
          iframeRef.current.src = currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_reload=' + Date.now();
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
  if (Platform.OS === 'web') {
    return <WebWebView {...props} ref={ref} />;
  }

  // For mobile platforms, use react-native-webview
  return <WebView {...props} ref={ref} />;
});

export default PlatformWebView;