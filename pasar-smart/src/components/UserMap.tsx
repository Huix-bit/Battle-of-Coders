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

const UserMap = forwardRef<UserMapRef, UserMapProps>(
  ({ targetLat, targetLng, marketName = "Night Market", onStepChange, onRouteFound, onLocationUpdate }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const routingControlRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const watchPositionIdRef = useRef<number | null>(null);
    const routeDirectionsRef = useRef<any[]>([]);
    const currentStepRef = useRef<number>(0);
    const userLocationRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

    // Step 1: Haversine formula to calculate distance between two coordinates (in meters)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

    // Step 2: Auto-advance step when user is close to waypoint
    const checkAndAdvanceStep = (userLat: number, userLng: number) => {
      const directions = routeDirectionsRef.current;
      if (!directions || directions.length === 0) return;

      const currentStep = currentStepRef.current;
      if (currentStep >= directions.length) return;

      const nextWaypoint = directions[currentStep];
      if (!nextWaypoint) return;

      // Extract waypoint coordinates from the instruction object
      const waypointLat = nextWaypoint.latLng?.lat 
        || nextWaypoint.lat 
        || directions[currentStep + 1]?.latLng?.lat;
      const waypointLng = nextWaypoint.latLng?.lng 
        || nextWaypoint.lng 
        || directions[currentStep + 1]?.latLng?.lng;

      if (!waypointLat || !waypointLng) return;

      const distance = calculateDistance(userLat, userLng, waypointLat, waypointLng);

      // Auto-advance if within 15 meters of waypoint
      if (distance < 15) {
        const nextStepIndex = currentStep + 1;
        if (nextStepIndex < directions.length) {
          currentStepRef.current = nextStepIndex;
          onStepChange?.(nextStepIndex);
        }
      }
    };

    // Step 3: Live position tracking using watchPosition
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

          // Update user marker position
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([newLat, newLng]);
          }

          // Calculate distance to destination
          const distToTarget = calculateDistance(newLat, newLng, targetLat, targetLng);

          // Notify parent component
          onLocationUpdate?.(newLat, newLng, distToTarget);

          // Check if user reached next step's waypoint
          checkAndAdvanceStep(newLat, newLng);
        },
        (error) => {
          console.warn("Geolocation watch error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000, // Update every 1 second
          timeout: 5000, // Request timeout
        }
      );

      watchPositionIdRef.current = watchId;
    };

    // Step 4: Extract directions from route and convert to step format
    const extractRouteDirections = (route: any) => {
      if (!route.instructions) return [];

      const directions = route.instructions.map((instruction: any, idx: number) => {
        return {
          step: idx + 1,
          instruction: instruction.text,
          distance: `${instruction.distance} m`,
          latLng: instruction.latLng,
          icon: getIconForInstruction(instruction.type),
        };
      });

      routeDirectionsRef.current = directions;
      currentStepRef.current = 0;
      onRouteFound?.(directions);
      return directions;
    };

    // Step 5: Get appropriate icon based on instruction type
    const getIconForInstruction = (instructionType: string): string => {
      const type = instructionType?.toLowerCase() || "";
      if (type.includes("straight") || type.includes("continue")) return "➡️";
      if (type.includes("left")) return "⬅️";
      if(type.includes("right")) return "➡️";
      if (type.includes("arrive") || type.includes("destination")) return "📍";
      if (type.includes("depart")) return "🔝";
      return "➡️";
    };

    // Step 6: Initialize map with all components
    const initializeMap = () => {
      // Check if Leaflet and Routing Machine are loaded
      if (typeof window === "undefined" || !(window as any).L || !(window as any).L.Routing) {
        console.warn("Leaflet or Routing Machine not yet loaded");
        return;
      }

      // Prevent multiple initializations
      if (mapRef.current) return;

      const L = (window as any).L;

    // Create map instance centered initially on target
    const map = L.map(mapContainer.current).setView([targetLat, targetLng], 15);
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Step 2: Get user's current location using geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Add user marker with custom icon
          L.marker([userLat, userLng], {
            icon: L.icon({
              iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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

          // Step 3: Add destination marker (non-movable)
          L.marker([targetLat, targetLng], {
            icon: L.icon({
              iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              iconSize: [32, 41],
              iconAnchor: [16, 41],
              shadowSize: [41, 41],
              shadowAnchor: [13, 41],
              popupAnchor: [1, -34],
            }),
            title: marketName,
            draggable: false, // User cannot move it
          })
            .addTo(map)
            .bindPopup(`🎯 ${marketName}`);

          // Step 4: Create routing control with fixed waypoints
          if (!routingControlRef.current) {
            const routingControl = L.Routing.control({
              waypoints: [L.latLng(userLat, userLng), L.latLng(targetLat, targetLng)],
              routeWhileDragging: false, // Disable dragging to keep route fixed
              draggableWaypoints: false, // User cannot move waypoints
              fitSelectedRoutes: true,
              showAlternatives: false,
              lineOptions: {
                styles: [
                  {
                    color: "#10b981", // emerald-500
                    opacity: 0.7,
                    weight: 5,
                  },
                ],
              },
              createMarker: () => null, // Hide default routing markers (we use our own)
              routeDragTimeout: 0,
            }).addTo(map);

            routingControlRef.current = routingControl;

            // Show summary when route is found
            routingControl.on("routesfound", (e: any) => {
              const routes = e.routes;
              if (routes.length > 0) {
                const distance = (routes[0].summary.totalDistance / 1000).toFixed(2);
                const time = Math.ceil(routes[0].summary.totalTime / 60);
                console.log(
                  `Route found: ${distance} km, estimated ${time} minutes`
                );
              }
            });
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback: just show the market location
          console.log("Using target location as fallback");
        }
      );
    }
  };

  // Step 5: Load scripts and initialize when ready
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetLat, targetLng]);

  return (
    <>
      {/* Load Leaflet CSS via inline style injection */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.css');
      `}</style>

      {/* Load Leaflet JS */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Leaflet loaded
          console.log("Leaflet loaded");
        }}
      />

      {/* Load Leaflet Routing Machine JS */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Routing Machine loaded");
          // Give a moment for both libraries to be ready
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

export default UserMap;
