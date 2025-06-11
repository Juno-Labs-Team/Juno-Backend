const originName = "Freehold High School";
const originLatLng = { lat: 40.260393, lng: -74.273017 };

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
const scheduledEvents = [
    {
      color: "A53860",
      rideEmoji: "🚗",
      rideName: "Morning Commute to School",
      date: "2025-06-04",
      time: "07:30 AM",
      location: "Freehold Township High School",
      coordinates: { lat: 40.0000, lng: -74.2732 },
      driver: "Emily Carter",
      passengers: 3,
      currentNumPassengers: 3
    },
    {
      color: "A53860",
      rideEmoji: "",
      rideName: "Weekend Group Carpool",
      date: "2025-06-07",
      time: "10:00 AM",
      location: "Monmouth Mall",
      coordinates: { lat: 40.2895, lng: -74.0565 },
      driver: "Jake Martinez",
      passengers: 4,
      currentNumPassengers: 1
    },
    {
      color: "42d415",
      rideEmoji: "",
      rideName: "Soccer Practice Pickup",
      date: "2025-06-05",
      time: "04:45 PM",
      location: "Freehold Soccer Complex",
      coordinates: { lat: 40.2418, lng: -74.2882 },
      driver: "Sophia Lee",
      passengers: 2,
      currentNumPassengers: 0
    },
    {
      color: "F7374F",
      rideEmoji: "🎤",
      rideName: "Concert Road Trip",
      date: "2025-06-08",
      time: "06:30 PM",
      location: "PNC Bank Arts Center",
      coordinates: { lat: 40.3929, lng: -74.1710 },
      driver: "Ryan Thompson",
      passengers: 5,
      currentNumPassengers: 0
    },
    {
      color: "6cd4c1",
      rideEmoji: "",
      rideName: "Library Study Group",
      date: "2025-06-06",
      time: "02:00 PM",
      location: "Freehold Public Library",
      coordinates: { lat: 40.2601, lng: -74.2732 },
      driver: "Lucas Scott",
      passengers: 3,
      currentNumPassengers: 0
    }
  ];

// Predefined distinct colors based on color theory
const distinctColors = [
    "#FF5733", // Red-Orange
    "#33FF57", // Green
    "#3357FF", // Blue
    "#FF33A1", // Pink
    "#FFD133", // Yellow
    "#33FFF5", // Cyan
    "#8D33FF", // Purple
    "#FF8C33"  // Orange
];

function getInfoContent(event) {
    return `
        <div style="
            font-family: 'Segoe UI', Arial, sans-serif;
            min-width:240px;
            max-width:340px;
            border-radius: 16px;
            border: 3px solid ${event.color};
            background: #23293a;
            color: #f6f7fa;
            padding: 18px 22px 15px 22px;
            box-sizing: border-box;
        ">
            <div style="display:flex;align-items:center;gap:12px;font-size:1.22em;font-weight:700;margin-bottom:12px;">
                ${event.rideEmoji ? `<span style="font-size:1.4em;">${event.rideEmoji}</span>` : ""}
                <span>${event.rideName}</span>
            </div>
            <div style="margin-bottom:14px;">
                <span style="display:inline-block;border-radius:8px;padding:4px 15px;font-size:1em;color:${event.color};border:1.7px solid ${event.color};background:none;">
                    To: ${event.location}
                </span>
            </div>
            <div style="margin-bottom:4px;font-size:0.98em;">
                <b>Date:</b> ${event.date}
                <span style="margin-left:18px;"><b>Time:</b> ${event.time}</span>
            </div>
            <div style="margin-bottom:4px;font-size:0.98em;"><b>Driver:</b> ${event.driver}</div>
            <div style="margin-bottom:8px;font-size:0.98em;"><b>Seats:</b> ${event.currentNumPassengers} / ${event.passengers}</div>
            ${
                event.waypoints && event.waypoints.length
                    ? `<div style="margin-top:8px;font-size:0.97em;">
                            <b>Stops:</b> ${
                                event.waypoints.map(wp =>
                                    `<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px 2px 8px;border-radius:7px;background:none;color:${event.color};font-size:0.94em;border:1px solid ${event.color};">${wp.name}</span>`
                                ).join("")
                            }
                        </div>`
                    : ""
            }
        </div>
    `;
}

async function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.7128, lng: -74.006 }, // Example coordinates
    zoom: 10,
  });

  // Use the predefined JSON data
  scheduledEvents.forEach((event) => {
    new google.maps.Marker({
      position: { lat: event.coordinates.lat, lng: event.coordinates.lng },
      map,
      title: event.rideName,
    });
  });
}

function renderEventsOnMap(events) {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: originLatLng,
        zoom: 8,
        styles: ultraMinimalDarkMapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    new google.maps.Marker({
        position: originLatLng,
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
        if (!event.coordinates) return;
        const destLatLng = event.coordinates;
        const color = distinctColors[index % distinctColors.length];
        event.color = color;

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
        map.addListener('click', function() {
            infowindow.close();
          });

        let waypoints = [];
        if (event.waypoints && event.waypoints.length) {
            waypoints = event.waypoints.map(wp => ({
                location: { lat: wp.lat, lng: wp.lng }, stopover: true
            }));
            event.waypoints.forEach((wp) => {
                new google.maps.Marker({
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
            });
        }

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

window.initMap = initMap;
