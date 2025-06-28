import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import PlatformWebView from '@/components/PlatformWebView';

export default function BrowserScreen() {
  const { url: initialUrl } = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef<any>(null);

  // Handle deep linking URL parameter
  useEffect(() => {
    if (initialUrl) {
      const decodedUrl = decodeURIComponent(initialUrl);
      const formattedUrl = formatUrl(decodedUrl);
      setUrl(decodedUrl);
      setCurrentUrl(formattedUrl);
      setShowWebView(true);
    }
  }, [initialUrl]);

  const formatUrl = (inputUrl: string): string => {
    if (!inputUrl.trim()) return '';
    
    let cleanUrl = inputUrl.trim();
    
    // Check if it looks like a search query (no dots or spaces with multiple words)
    if (!cleanUrl.includes('.') || (cleanUrl.includes(' ') && cleanUrl.split(' ').length > 1)) {
      // Treat as search query
      return `https://www.google.com/search?q=${encodeURIComponent(cleanUrl)}`;
    }
    
    // Remove any existing protocol
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    
    // Add https:// if no protocol specified
    if (!cleanUrl.includes('://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    return cleanUrl;
  };

  const handleUrlSubmit = () => {
    const formattedUrl = formatUrl(url);
    if (!formattedUrl) return;
    
    setCurrentUrl(formattedUrl);
    setError(null);
    setShowWebView(true);
    Keyboard.dismiss();
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (error: any) => {
    setLoading(false);
    setError('This website cannot be displayed due to security restrictions.');
  };

  const handleNavigationStateChange = (navState: any) => {
    if (navState.url !== currentUrl) {
      setUrl(navState.url);
    }
  };

  const goHome = () => {
    setShowWebView(false);
    setCurrentUrl('');
    setUrl('');
    
    // Exit fullscreen when going home
    if (Platform.OS === 'web') {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen?.();
      } else if ((document as any).mozFullScreenElement) {
        (document as any).mozCancelFullScreen?.();
      } else if ((document as any).msFullscreenElement) {
        (document as any).msExitFullscreen?.();
      }
    }
  };

  // Add keyboard listener for ESC key to go home
  useEffect(() => {
    if (Platform.OS === 'web' && showWebView) {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          goHome();
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [showWebView]);

  if (!showWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.brandingContainer}>
            <Text style={styles.appTitle}>Browser</Text>
            <Text style={styles.appSubtitle}>Immersive fullscreen web browsing</Text>
          </View>
          
          <View style={styles.urlContainer}>
            <TextInput
              style={styles.urlInput}
              value={url}
              onChangeText={setUrl}
              placeholder="Search or enter website URL"
              placeholderTextColor="#8E8E93"
              keyboardType="web-search"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleUrlSubmit}
              autoFocus={!initialUrl} // Only auto-focus if not launched from deep link
            />
            <TouchableOpacity style={styles.goButton} onPress={handleUrlSubmit}>
              <Text style={styles.goButtonText}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featureText}>
              ✨ Automatic fullscreen mode for distraction-free browsing
            </Text>
            <Text style={styles.featureSubtext}>
              Press ESC key to return home from any website
            </Text>
            <Text style={styles.deepLinkInfo}>
              💡 Launch with URLs: browser-app://open?url=https://example.com
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fullscreenContainer}>
      <PlatformWebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        allowsBackForwardNavigationGestures={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -2,
  },
  appSubtitle: {
    fontSize: 20,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  urlContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 32,
  },
  urlInput: {
    flex: 1,
    height: 52,
    fontSize: 18,
    color: '#000000',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  goButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    alignItems: 'center',
    maxWidth: 500,
  },
  featureText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  deepLinkInfo: {
    fontSize: 13,
    color: '#34C759',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
  },
});