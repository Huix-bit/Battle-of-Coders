"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Script from "next/script";

interface UserMapProps {
  targetLat: number;
  targetLng: number;
  marketName?: string;
  onStepChange?: (stepIndex: number) => void;
  onRouteFound?: (directions: any[]) => void;
  onLocationUpdate?: (lat: number, lng: number, distance: number) => void;
}

export interface UserMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  getRouteDirections: () => any[];
}

const UserMapLiveGPS = forwardRef<UserMapRef, UserMapProps>(
  (
    {
      targetLat,
      targetLng,
      marketName = "Night Market",
      onStepChange,
      onRouteFound,
      onLocationUpdate,
    },
    ref
  ) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const routingControlRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const watchPositionIdRef = useRef<number | null>(null);
    const routeDirectionsRef = useRef<any[]>([]);
    const currentStepRef = useRef<number>(0);
    const userLocationRef = useRef<{ lat: number; lng: number }>({
      lat: 0,
      lng: 0,
    });
    const isNavigatingRef = useRef<boolean>(false);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: Haversine Formula
    // ──────────────────────────────────────────────────────────────────────────
    // Calculates distance in meters between two GPS coordinates
    const calculateDistance = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: Auto-Advance Steps
    // ──────────────────────────────────────────────────────────────────────────
    // When user is within 15 meters of a waypoint, automatically advance to next step
    const checkAndAdvanceStep = (userLat: number, userLng: number) => {
      if (!isNavigatingRef.current) return;

      const directions = routeDirectionsRef.current;
      if (!directions || directions.length === 0) return;

      const currentStep = currentStepRef.current;
      if (currentStep >= directions.length) return;

      const nextWaypoint = directions[currentStep];
      if (!nextWaypoint?.latLng) return;

      const waypointLat = nextWaypoint.latLng.lat;
      const waypointLng = nextWaypoint.latLng.lng;

      const distance = calculateDistance(
        userLat,
        userLng,
        waypointLat,
        waypointLng
      );

      // Auto-advance if within 15 meters
      if (distance < 15 && currentStep + 1 < directions.length) {
        const nextStepIndex = currentStep + 1;
        currentStepRef.current = nextStepIndex;
        onStepChange?.(nextStepIndex);
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3: Live Tracking with watchPosition
    // ──────────────────────────────────────────────────────────────────────────
    // Updates user location in real-time as GPS signal changes
    const startLiveTracking = (userLat: number, userLng: number) => {
      if (!navigator.geolocation) return;

      // Clear previous watch if exists
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;

          userLocationRef.current = { lat: newLat, lng: newLng };

          // Update user marker position in real-time
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([newLat, newLng]);
          }

          // Calculate distance to destination
          const distToTarget = calculateDistance(
            newLat,
            newLng,
            targetLat,
            targetLng
          );

          // Notify parent of location update
          onLocationUpdate?.(newLat, newLng, distToTarget);

          // Check if user reached next step's waypoint
          checkAndAdvanceStep(newLat, newLng);
        },
        (error) => {
          console.warn("Geolocation watch error:", error);
        },
        {
          enableHighAccuracy: true, // Use GPS instead of approximation
          maximumAge: 1000, // Update every 1 second
          timeout: 5000, // Request timeout
        }
      );

      watchPositionIdRef.current = watchId;
    };

    const stopLiveTracking = () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: Extract Route Directions from Leaflet Routing
    // ──────────────────────────────────────────────────────────────────────────
    // Converts Leaflet Routing Machine instructions into custom UI format
    const extractRouteDirections = (route: any) => {
      if (!route.instructions) return [];

      const directions = route.instructions.map((instruction: any) => {
        return {
          step: instruction.index || 0,
          instruction: instruction.text || "Navigate",
          distance: `${Math.round(instruction.distance)} m`,
          latLng: instruction.latLng, // Contains {lat, lng} for auto-advance
          icon: getIconForInstruction(instruction.type),
          type: instruction.type,
        };
      });

      routeDirectionsRef.current = directions;
      currentStepRef.current = 0;
      onRouteFound?.(directions);

      return directions;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 5: Get Icon Based on Direction Type
    // ──────────────────────────────────────────────────────────────────────────
    const getIconForInstruction = (instructionType: string): string => {
      const type = instructionType?.toLowerCase() || "";
      if (type.includes("straight") || type.includes("continue")) return "➡️";
      if (type.includes("left")) return "⬅️";
      if (type.includes("right")) return "➡️";
      if (type.includes("arrive") || type.includes("destination"))
        return "📍";
      if (type.includes("depart")) return "🔝";
      if (type.includes("uturn")) return "🔄";
      return "➡️";
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 6: Initialize Map and Setup Routing
    // ──────────────────────────────────────────────────────────────────────────
    const initializeMap = () => {
      // Check if libraries are loaded
      if (
        typeof window === "undefined" ||
        !(window as any).L ||
        !(window as any).L.Routing
      ) {
        console.warn("Leaflet or Routing Machine not yet loaded");
        return;
      }

      // Prevent multiple initializations
      if (mapRef.current) return;

      const L = (window as any).L;

      // Create map instance
      const map = L.map(mapContainer.current).setView(
        [targetLat, targetLng],
        15
      );
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            userLocationRef.current = { lat: userLat, lng: userLng };

            // ──────────────────────────────────────────────────────────────────
            // Add user marker
            // ──────────────────────────────────────────────────────────────────
            const userMarker = L.marker([userLat, userLng], {
              icon: L.icon({
                iconUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                shadowSize: [41, 41],
                shadowAnchor: [13, 41],
                popupAnchor: [1, -34],
              }),
              title: "Your Location",
            })
              .addTo(map)
              .bindPopup("📍 You are here");

            userMarkerRef.current = userMarker;

            // ──────────────────────────────────────────────────────────────────
            // Add destination marker
            // ──────────────────────────────────────────────────────────────────
            L.marker([targetLat, targetLng], {
              icon: L.icon({
                iconUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                shadowUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                iconSize: [32, 41],
                iconAnchor: [16, 41],
                shadowSize: [41, 41],
                shadowAnchor: [13, 41],
                popupAnchor: [1, -34],
              }),
              title: marketName,
              draggable: false,
            })
              .addTo(map)
              .bindPopup(`🎯 ${marketName}`);

            // ──────────────────────────────────────────────────────────────────
            // Create routing control (REQUIREMENT 1: Hide default itinerary)
            // ──────────────────────────────────────────────────────────────────
            if (!routingControlRef.current) {
              const routingControl = L.Routing.control({
                waypoints: [
                  L.latLng(userLat, userLng),
                  L.latLng(targetLat, targetLng),
                ],
                routeWhileDragging: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
                show: false, // ← HIDE default itinerary box
                lineOptions: {
                  styles: [
                    {
                      color: "#10b981",
                      opacity: 0.7,
                      weight: 5,
                    },
                  ],
                },
                createMarker: () => null,
                routeDragTimeout: 0,
              }).addTo(map);

              routingControlRef.current = routingControl;

              // ────────────────────────────────────────────────────────────────
              // REQUIREMENT 4: Listen to routefound to extract directions
              // ────────────────────────────────────────────────────────────────
              routingControl.on("routesfound", (e: any) => {
                const routes = e.routes;
                if (routes.length > 0) {
                  const route = routes[0];
                  console.log(
                    `Route found: ${(route.summary.totalDistance / 1000).toFixed(2)} km`
                  );

                  // Extract directions for custom UI
                  extractRouteDirections(route);
                }
              });
            }

            // Start live tracking after route is set up
            startLiveTracking(userLat, userLng);
          },
          (error) => {
            console.warn("Geolocation error:", error);
          }
        );
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 7: Expose methods via useImperativeHandle
    // ──────────────────────────────────────────────────────────────────────────
    // These can be called from parent component via ref
    useImperativeHandle(ref, () => ({
      // Start navigation: zoom to user location and enable tracking
      startNavigation: () => {
        isNavigatingRef.current = true;

        const map = mapRef.current;
        const userLocation = userLocationRef.current;

        if (map && userLocation) {
          // REQUIREMENT 2: Zoom aggressively (level 19) to user location
          map.setView([userLocation.lat, userLocation.lng], 19);
        }

        // Resume live tracking if it was paused
        if (userLocationRef.current) {
          startLiveTracking(
            userLocationRef.current.lat,
            userLocationRef.current.lng
          );
        }
      },

      // Stop navigation
      stopNavigation: () => {
        isNavigatingRef.current = false;
        stopLiveTracking();
      },

      // Get current directions for UI
      getRouteDirections: () => {
        return routeDirectionsRef.current;
      },
    }));

    // ──────────────────────────────────────────────────────────────────────────
    // Load scripts and initialize
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
      const timer = setTimeout(() => {
        initializeMap();
      }, 500);

      return () => {
        clearTimeout(timer);
        stopLiveTracking();
      };
    }, [targetLat, targetLng]);

    return (
      <>
        {/* Hide default Leaflet Routing Machine itinerary (REQUIREMENT 1 CSS fallback) */}
        <style>{`
          @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
          @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.css');
          
          /* Hide the default routing itinerary panel */
          .leaflet-routing-container {
            display: none !important;
          }
        `}</style>

        {/* Load Leaflet JS */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
          strategy="afterInteractive"
        />

        {/* Load Leaflet Routing Machine JS */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            setTimeout(() => {
              initializeMap();
            }, 100);
          }}
        />

        {/* Map container */}
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "500px",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        />
      </>
    );
  }
);

UserMapLiveGPS.displayName = "UserMapLiveGPS";

export default UserMapLiveGPS;
