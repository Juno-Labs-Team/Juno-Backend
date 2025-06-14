import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const NEON = '#00ffe7';
const SCREEN_WIDTH = Dimensions.get('window').width;

// The map widget will get events from API, not hardcoded.
const MAP_WIDGET_HTML = (rides) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NJ Routes Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body { height: 100%; }
    body {
      margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
      height: 100vh; background: #0d0d0d;
    }
    #map { height: 100vh; width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
    .event-overlay-collapsible { pointer-events: auto; max-width: 170px; user-select: none; min-width: 60px; box-sizing: border-box; }
    @media (max-width: 600px) {
      .event-overlay-collapsible { font-size: 11px; padding: 3px 5px; max-width: 110px; }
    }
    .gm-style-iw, .gm-style-iw-c, .gm-style-iw-d { background: transparent !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; clip-path: inset(0 19px 12px 0); }
    .gm-style-iw-tc > div, .gm-style-iw-t::after, .gm-style-iw-t::before { display: none !important; }
    .gm-ui-hover-effect { top: 40px !important; right: 23px !important; left: auto !important; width: 32px !important; height: 32px !important; z-index: 1 !important; }
    .gm-ui-hover-effect > span { margin: 4px !important; width: 24px !important; height: 24px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const scheduledEvents = ${JSON.stringify(rides)};
    const ultraMinimalDarkMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#242f3e" }] }
    ];
    const distinctColors = [
        "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFD133", "#33FFF5", "#8D33FF", "#FF8C33"
    ];

    function getInfoContent(event) {
        return \`
            <div style="
                font-family: 'Segoe UI', Arial, sans-serif;
                min-width:240px;
                max-width:340px;
                border-radius: 16px;
                border: 3px solid #\${event.color};
                background: #23293a;
                color: #f6f7fa;
                padding: 18px 22px 15px 22px;
                box-sizing: border-box;
            ">
                <div style="display:flex;align-items:center;gap:12px;font-size:1.22em;font-weight:700;margin-bottom:12px;">
                    \${event.emoji ? \`<span style="font-size:1.4em;">\${event.emoji}</span>\` : ""}
                    <span>\${event.title || ""}</span>
                </div>
                <div style="margin-bottom:14px;">
                    <span style="display:inline-block;border-radius:8px;padding:4px 15px;font-size:1em;color:#\${event.color};border:1.7px solid #\${event.color};background:none;">
                        To: \${(event.location && event.location.destination && event.location.destination.name) || event.destination || ""}
                    </span>
                </div>
                <div style="margin-bottom:4px;font-size:0.98em;">
                    <b>Date:</b> \${event.date}
                    <span style="margin-left:18px;"><b>Time:</b> \${event.time}</span>
                </div>
                <div style="margin-bottom:4px;font-size:0.98em;"><b>Driver:</b> \${event.driverName || (event.driver ? (event.driver.firstName + " " + event.driver.lastName) : "")}</div>
                <div style="margin-bottom:8px;font-size:0.98em;"><b>Seats:</b> \${typeof event.currentPassengers !== 'undefined' ? event.currentPassengers : 0} / \${typeof event.maxPassengers !== 'undefined' ? event.maxPassengers : 0}</div>
                \${
                    event.waypoints && event.waypoints.length
                        ? \`<div style="margin-top:8px;font-size:0.97em;">
                                <b>Stops:</b> \${
                                    event.waypoints.map(wp =>
                                        \`<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px 2px 8px;border-radius:7px;background:none;color:#\${event.color};font-size:0.94em;border:1px solid #\${event.color};">\${wp.name}</span>\`
                                    ).join("")
                                }
                            </div>\`
                        : ""
                }
            </div>
        \`;
    }

    function renderEventsOnMap(events) {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.260393, lng: -74.273017 },
        zoom: 8,
        styles: ultraMinimalDarkMapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    // Add a marker for the origin (Freehold High School)
    new google.maps.Marker({
        position: { lat: 40.260393, lng: -74.273017 },
        map,
        icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: "#FFFF33",
            fillOpacity: 1,
            strokeColor: "#222",
            strokeWeight: 2
        }
    });

    const infowindow = new google.maps.InfoWindow();

    events.forEach((event, index) => {
        // Use the ride's own origin if available, otherwise default to Freehold High School
        const originLatLng = event.location && event.location.origin
            ? { lat: event.location.origin.lat, lng: event.location.origin.lng }
            : { lat: 40.260393, lng: -74.273017 };

        const destLatLng = event.location && event.location.destination
            ? { lat: event.location.destination.lat, lng: event.location.destination.lng }
            : null;

        if (!destLatLng) return;

        const color = distinctColors[index % distinctColors.length];
        event.color = color.replace("#", "");

        // Add a marker for the destination
        const marker = new google.maps.Marker({
            position: destLatLng,
            map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2
            }
        });

        marker.addListener("click", function () {
            infowindow.setContent(getInfoContent(event));
            infowindow.open(map, marker);
        });

        map.addListener('click', function () { infowindow.close(); });

        // Add waypoints if available
        let waypoints = [];
        if (event.waypoints && event.waypoints.length) {
            waypoints = event.waypoints.map(wp => ({
                location: { lat: wp.lat, lng: wp.lng },
                stopover: true
            }));

            event.waypoints.forEach((wp) => {
                const waypointMarker = new google.maps.Marker({
                    position: { lat: wp.lat, lng: wp.lng },
                    map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: color,
                        fillOpacity: 0.55,
                        strokeColor: "#fff",
                        strokeWeight: 1.2
                    }
                });

                // Info window for waypoint
                const wpInfoWindow = new google.maps.InfoWindow({
                    content: wp.name || "Stop"
                });

                waypointMarker.addListener('click', () => {
                    wpInfoWindow.open(map, waypointMarker);
                });
            });
        }

        // Create a new DirectionsRenderer for each route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 6
            }
        });

        // Request the route
        directionsService.route(
            {
                origin: originLatLng,
                destination: destLatLng,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result);
                } else {
                    console.error("Directions request failed due to: " + status);
                }
            }
        );
    });
}
    function initMap() { renderEventsOnMap(scheduledEvents); }
    window.initMap = initMap;
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCEgktHm0Qax3jLSu-Ne_if9PIyyFVpTkY&callback=initMap"></script>
</body>
</html>
`;

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    fetchRides();
  }, []);

  // Fetch rides from database via API client
  const fetchRides = async () => {
    try {
      setLoading(true);
      const ridesData = await apiClient.getRides();
      setRides(ridesData);
      setMapHtml(MAP_WIDGET_HTML(ridesData));
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      setRides([]);
      setMapHtml(MAP_WIDGET_HTML([]));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const getComplementaryColor = (hex) => {
    if (!hex) return NEON;
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let compR = 255 - r;
    let compG = 255 - g;
    let compB = 255 - b;
    return `#${compR.toString(16).padStart(2, "0")}${compG.toString(16).padStart(2, "0")}${compB.toString(16).padStart(2, "0")}`;
  };

  const getTextColor = (hex) => {
    if (!hex) return "#FFFFFF";
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    return brightness > 130 ? "#000000" : "#FFFFFF";
  };

  const RideCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const animation = useState(new Animated.Value(0))[0];

    // Map DB fields for compatibility
    const availableSeats = (item.maxPassengers || item.passengers || 4) - (item.currentPassengers || item.currentNumPassengers || 0);
    const hasAvailableSeats = availableSeats > 0;
    const cardColor = item.color || '4285F4';
    const buttonColor = getComplementaryColor(cardColor);
    const buttonTextColor = getTextColor(buttonColor);

    const animatedHeight = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, hasAvailableSeats ? 160 : 120],
    });

    const toggleExpand = () => {
      Animated.timing(animation, {
        toValue: expanded ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setExpanded(!expanded);
    };

    const handleBookRide = () => {
      navigation.navigate('BookRide', { rideId: item.id, rideDetails: item });
    };

    return (
      <TouchableOpacity
        onPress={toggleExpand}
        style={[
          styles.rideCard,
          {
            backgroundColor: `#${cardColor}`,
            shadowColor: `#${cardColor}`,
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.rideTitle}>
            {item.title || ""}
            {item.emoji || item.rideEmoji || ' 🚗'}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {hasAvailableSeats ? 'OPEN' : 'FULL'}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.expandedContent, { height: animatedHeight, overflow: 'hidden' }]}>
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {item.date} at {item.time}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {(item.origin ? `${item.origin} → ` : '')}
                {(item.location && item.location.destination && item.location.destination.name) || item.destination || ''}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {item.driverName ||
                  (item.driver
                    ? [item.driver.firstName, item.driver.lastName].filter(Boolean).join(" ")
                    : "")}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {typeof item.maxPassengers !== 'undefined'
                  ? item.maxPassengers
                  : (item.passengers || 0)} seats ({availableSeats} available)
              </Text>
            </View>
            {item.pricePerSeat && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text style={styles.detailText}>${item.pricePerSeat} per seat</Text>
              </View>
            )}
          </View>
          {hasAvailableSeats && (
            <TouchableOpacity
              style={[
                styles.bookButton,
                { backgroundColor: buttonColor },
              ]}
              onPress={handleBookRide}
              activeOpacity={0.8}
            >
              <Ionicons name="car-outline" size={18} color={buttonTextColor} />
              <Text style={[styles.bookButtonText, { color: buttonTextColor }]}>
                Book This Ride
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Map widget uses the dynamic HTML generated from rides
  const MapEmbed = () => {
    const [iframeError, setIframeError] = useState(false);

    if (!mapHtml) {
      return (
        <View style={styles.rightWidget}>
          <Text style={{ color: '#fff', padding: 24 }}>Loading map...</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.rightWidget}>
          {!iframeError ? (
            <iframe
              srcDoc={mapHtml}
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
              onError={() => setIframeError(true)}
            />
          ) : (
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              <Text style={{ color: '#fff', padding: 16, fontSize: 16 }}>
                Map could not be loaded.
              </Text>
            </View>
          )}
        </View>
      );
    } else if (WebView) {
      return (
        <View style={styles.rightWidget}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#0d0d0d'
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        </View>
      );
    }
    return (
      <View style={styles.rightWidget}>
        <Text style={{ color: '#fff' }}>Map is not available.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Rides</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={NEON} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          {loading ? (
            <ActivityIndicator size="large" color={NEON} style={{marginTop: 40}} />
          ) : (
            <FlatList
              data={rides}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => <RideCard item={item} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={NEON}
                  colors={[NEON]}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="car-outline" size={64} color="#666" />
                  <Text style={styles.emptyTitle}>No rides available</Text>
                  <Text style={styles.emptyText}>
                    Check back later for upcoming rides or create your own!
                  </Text>
                  <TouchableOpacity
                    style={styles.createRideButton}
                    onPress={() => navigation.navigate('CreateRide')}
                  >
                    <Ionicons name="add" size={20} color="#000" />
                    <Text style={styles.createRideText}>Create Ride</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
        <MapEmbed />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textShadowColor: NEON, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  refreshButton: { padding: 8 },
  row: { flexDirection: 'row', flex: 1 },
  leftColumn: { width: SCREEN_WIDTH * 0.5, paddingLeft: 20, paddingRight: 8 },
  listContainer: { paddingBottom: 20 },
  rideCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    overflow: 'hidden',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  rideDetails: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.9,
    textAlign: 'left',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createRideText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
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

export default HomeScreen;