import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

// Helper to recursively extract text nodes from React children
function getTextFromChildren(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextFromChildren).join('');
  }
  if (node.props && node.props.children) {
    return getTextFromChildren(node.props.children);
  }
  return '';
}

export const Marker = React.forwardRef((props: any, ref: any) => {
  return null;
});

const MapView = React.forwardRef((props: any, ref: any) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Extract initial center from initialRegion or region
  const defaultLat = 12.9716; // Bangalore default
  const defaultLng = 77.5946;
  
  const initialLat = props.initialRegion?.latitude || props.region?.latitude || defaultLat;
  const initialLng = props.initialRegion?.longitude || props.region?.longitude || defaultLng;

  // Process children markers
  const markers: any[] = [];
  let pickerLat = 0;
  let pickerLng = 0;
  const pressHandlers: { [key: string]: () => void } = {};

  const childrenArray = React.Children.toArray(props.children);
  childrenArray.forEach((child: any, idx) => {
    if (!child || !child.props) return;
    
    const coord = child.props.coordinate;
    if (!coord) return;
    
    const key = child.key || `marker-${idx}`;
    
    // If it's a single marker or has pinColor, it's the picker marker (for add.tsx)
    if (child.props.pinColor || childrenArray.length === 1) {
      pickerLat = coord.latitude;
      pickerLng = coord.longitude;
    } else {
      const text = getTextFromChildren(child.props.children);
      markers.push({
        id: key,
        latitude: coord.latitude,
        longitude: coord.longitude,
        text: text || 'Rent'
      });
      if (child.props.onPress) {
        pressHandlers[key] = child.props.onPress;
      }
    }
  });

  // Expose animateToRegion to parent components using a ref
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: any, duration?: number) => {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'FLY_TO',
        lat: region.latitude,
        lng: region.longitude,
        zoom: 15
      }, '*');
    }
  }));

  // Handle messages sent from the Leaflet map iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'MARKER_CLICK') {
        const handler = pressHandlers[data.propertyId];
        if (handler) {
          handler();
        }
      } else if (data.type === 'MAP_CLICK' && props.onPress) {
        props.onPress({
          nativeEvent: {
            coordinate: {
              latitude: data.latitude,
              longitude: data.longitude
            }
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [props.onPress, pressHandlers]);

  // Sync component region updates back to the map (specifically for Picker / Search syncs)
  useEffect(() => {
    if (props.region) {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'FLY_TO',
        lat: props.region.latitude,
        lng: props.region.longitude,
        zoom: 15
      }, '*');
    }
  }, [props.region?.latitude, props.region?.longitude]);

  // Leaflet inside a styled dark-theme template document
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background-color: #121212;
        }
        .leaflet-container {
          background: #121212 !important;
        }
        /* Custom dark-mode rent bubble markers */
        .custom-price-marker {
          background-color: #1E1E1E;
          border: 1px solid #2D2D2D;
          border-radius: 8px;
          color: #FFFFFF;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          font-weight: bold;
          padding: 5px 8px;
          text-align: center;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          transition: all 0.15s ease-in-out;
        }
        .custom-price-marker-selected {
          background-color: #BB86FC;
          color: #121212;
          border-color: #BB86FC;
          box-shadow: 0 0 10px rgba(187, 134, 252, 0.6);
          transform: scale(1.08);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${initialLat}, ${initialLng}], 13);

        // CartoDB Dark Matter map tile provider
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        var markers = {};
        var selectedMarkerId = null;

        // Render listings
        var properties = ${JSON.stringify(markers)};
        properties.forEach(function(item) {
          var myIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div id="bubble-' + item.id + '" class="custom-price-marker">' + item.text + '</div>',
            iconSize: [60, 26],
            iconAnchor: [30, 13]
          });

          var marker = L.marker([item.latitude, item.longitude], { icon: myIcon }).addTo(map);
          markers[item.id] = marker;

          marker.on('click', function() {
            window.parent.postMessage({ type: 'MARKER_CLICK', propertyId: item.id }, '*');
            highlightMarker(item.id);
          });
        });

        // Setup property picker (for add.tsx)
        var pickerLat = ${pickerLat};
        var pickerLng = ${pickerLng};
        var pickerMarker = null;

        if (pickerLat !== 0 && pickerLng !== 0) {
          var pickerIcon = L.divIcon({
            className: 'custom-picker-icon',
            html: '<div style="background-color: #BB86FC; width: 12px; height: 12px; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 8px #BB86FC;"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          pickerMarker = L.marker([pickerLat, pickerLng], { icon: pickerIcon }).addTo(map);
        }

        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          
          if (pickerMarker) {
            pickerMarker.setLatLng([lat, lng]);
            window.parent.postMessage({ type: 'MAP_CLICK', latitude: lat, longitude: lng }, '*');
          }
        });

        function highlightMarker(id) {
          // Clear previous highlight
          if (selectedMarkerId) {
            var prevEl = document.getElementById('bubble-' + selectedMarkerId);
            if (prevEl) prevEl.classList.remove('custom-price-marker-selected');
          }
          // Set new highlight
          selectedMarkerId = id;
          var nextEl = document.getElementById('bubble-' + id);
          if (nextEl) nextEl.classList.add('custom-price-marker-selected');
        }

        // Listener for parent flyTo messages
        window.addEventListener('message', function(event) {
          var msg = event.data;
          if (msg && msg.type === 'FLY_TO') {
            map.setView([msg.lat, msg.lng], msg.zoom || 14);
            
            // Check if coordinates match an existing marker to highlight it
            properties.forEach(function(item) {
              if (Math.abs(item.latitude - msg.lat) < 0.0001 && Math.abs(item.longitude - msg.lng) < 0.0001) {
                highlightMarker(item.id);
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={props.style}>
      <iframe
        ref={iframeRef}
        srcDoc={leafletHtml}
        onLoad={() => {
          if (props.onMapReady) {
            props.onMapReady();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#121212',
        }}
        title="Web Interactive Map"
      />
    </View>
  );
});

export default MapView;
