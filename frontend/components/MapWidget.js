import React from 'react';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Web: Use iframe to embed the HTML map widget. 
// Native: You need to run a local dev server or host this file online for WebView.
const MAP_WIDGET_PATH_WEB = '/frontend/MAP/index.html';
// For native, update the URL if you deploy the HTML somewhere accessible to your app.
const MAP_WIDGET_PATH_NATIVE = 'https://your-domain-or-local-server/frontend/MAP/index.html';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const MapWidget = () => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.rightWidget}>
        <iframe
          src={MAP_WIDGET_PATH_WEB}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 400,
            borderRadius: 16,
            border: 'none',
            overflow: 'hidden',
            background: '#0d0d0d'
          }}
          title="Map Widget"
        />
      </View>
    );
  }
  // On native, use WebView and point to your hosted map.
  return (
    <View style={styles.rightWidget}>
      <WebView
        source={{ uri: MAP_WIDGET_PATH_NATIVE }}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#0d0d0d'
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rightWidget: {
    width: SCREEN_WIDTH * 0.5,
    minHeight: 400,
    borderRadius: 16,
    marginLeft: 12,
    overflow: 'hidden',
    backgroundColor: '#10162d',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});

export default MapWidget;