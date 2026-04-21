"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserMap from "@/components/UserMap";

// Example: These would come from your database in a real implementation
// For now, this is mock data showing how the coordinates flow

interface MarketLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  operatingHours: string;
}

// Mock database function - replace with actual Supabase/API call
async function fetchMarketLocation(): Promise<MarketLocation> {
  // In real implementation:
  // const { data } = await supabase.from('markets').select('*').single();
  
  return {
    id: 1,
    name: "Pasar Malam Melaka",
    latitude: 2.1896,
    longitude: 102.6483,
    address: "Jalan Banda, 75200 Melaka",
    operatingHours: "6:00 PM - 11:30 PM",
  };
}

export default function NavigateToMarketPage() {
  const [market, setMarket] = useState<MarketLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarket = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketLocation();
        setMarket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load market data");
      } finally {
        setLoading(false);
      }
    };

    loadMarket();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text)]">Loading map...</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Getting your location</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-red-400">Failed to load market</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
        <Link
          href="/user/discover"
          className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/user" className="hover:text-[var(--text)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--text)]">Navigate to Market</span>
        </div>
        <Link
          href="/user/discover"
          className="rounded-lg border border-[var(--border)] bg-[var(--lifted)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:border-emerald-500/40 transition-all"
        >
          ← Back
        </Link>
      </div>

      {/* Market Info Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">🗺️ {market.name}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">📍 {market.address}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-semibold text-[var(--text)]">Operating Hours:</span>
            <p className="text-[var(--muted)]">{market.operatingHours}</p>
          </div>
          <div>
            <span className="font-semibold text-[var(--text)]">Coordinates:</span>
            <p className="text-[var(--muted)]">{market.latitude.toFixed(4)}, {market.longitude.toFixed(4)}</p>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
          ✓ Enable location access to see directions from your current position to the market.
        </p>
      </div>

      {/* Interactive Map - Component automatically:
          1. Gets user's current location via navigator.geolocation
          2. Draws route from user to targetLat/targetLng
          3. Shows markers and distance/time info
       */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <UserMap
          targetLat={market.latitude}
          targetLng={market.longitude}
          marketName={market.name}
        />
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h2 className="font-semibold text-[var(--text)] mb-3">📍 How to Use</h2>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>✓ Allow location access when prompted by your browser</li>
          <li>✓ The blue route shows the path to the market</li>
          <li>✓ Green pin = your location | Red pin = market location</li>
          <li>✓ Distance and estimated time shown on the route</li>
          <li>✓ Route is automatically calculated for you</li>
        </ul>
      </div>

      {/* Code Integration Example */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--lifted)] p-6">
        <h2 className="font-semibold text-[var(--text)] mb-3">💻 Integration Example</h2>
        <div className="overflow-x-auto">
          <pre className="rounded-lg bg-[var(--abyss)] p-4 text-xs text-emerald-300 font-mono">
{`// Step 1: Fetch coordinates from your database
const { data: market } = await supabase
  .from('markets')
  .select('latitude, longitude, name')
  .single();

// Step 2: Pass to UserMap component
<UserMap
  targetLat={market.latitude}
  targetLng={market.longitude}
  marketName={market.name}
/>

// The component handles everything:
// - Loading Leaflet via CDN
// - Getting user's geolocation
// - Drawing route automatically
// - Preventing destination moving`}
          </pre>
        </div>
      </div>
    </div>
  );
}
