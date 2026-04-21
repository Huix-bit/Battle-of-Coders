"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredDistrict, setPreferredDistrict] = useState("Melaka Tengah");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [favoriteCategory, setFavoriteCategory] = useState("Food & Beverage");
  const [dietaryPreferences, setDietaryPreferences] = useState({
    halal: false,
    vegetarian: false,
    noSeafood: false,
  });
  const [liveUpdates, setLiveUpdates] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          setEmail(user.email || "");
          
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, phone_number, preferred_district, date_of_birth, gender, favorite_category, dietary_preferences, live_updates")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            throw profileError;
          }

          if (data) {
            setFullName(data.full_name || "");
            setPhoneNumber(data.phone_number || "");
            setPreferredDistrict(data.preferred_district || "Melaka Tengah");
            setDateOfBirth(data.date_of_birth || "");
            setGender(data.gender || "");
            setFavoriteCategory(data.favorite_category || "Food & Beverage");
            if (data.dietary_preferences) {
              setDietaryPreferences({
                halal: data.dietary_preferences.halal ?? false,
                vegetarian: data.dietary_preferences.vegetarian ?? false,
                noSeafood: data.dietary_preferences.noSeafood ?? false,
              });
            }
            if (data.live_updates !== undefined && data.live_updates !== null) {
              setLiveUpdates(data.live_updates);
            }
          } else {
            // Mock data fallback if profile not found
            setFullName("Razif Pelanggan");
            setEmail(user.email || "user@pasar.smart");
          }
        } else {
          // Fallback if no user is authenticated
          setFullName("Razif Pelanggan");
          setEmail("user@pasar.smart");
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        // Fallback for visual completeness
        setFullName("Razif Pelanggan");
        setEmail("user@pasar.smart");
      } finally {
        setFetching(false);
      }
    }

    getProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user authenticated. Cannot update profile.");
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          preferred_district: preferredDistrict,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          favorite_category: favoriteCategory,
          dietary_preferences: dietaryPreferences,
          live_updates: liveUpdates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      router.push("/user/profile");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#4c1d95_0%,_transparent_60%)] opacity-40 pointer-events-none" />
          
          <h1 className="text-2xl font-bold text-white mb-8 text-center">Edit Profile</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-5xl overflow-hidden cursor-pointer transition-all hover:border-purple-500">
                  👤
                </div>
                <button
                  type="button"
                  className="absolute inset-0 bg-black/60 text-white text-sm font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                >
                  Upload
                </button>
              </div>
              <p className="text-sm text-slate-400 font-medium">Avatar Image</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="Razif Pelanggan"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="+60 12-345 6789"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-medium text-slate-300">
                Preferred District
              </label>
              <div className="relative">
                <select
                  id="district"
                  value={preferredDistrict}
                  onChange={(e) => setPreferredDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner appearance-none"
                >
                  <option value="Melaka Tengah">Melaka Tengah</option>
                  <option value="Alor Gajah">Alor Gajah</option>
                  <option value="Jasin">Jasin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-300">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium text-slate-300">
                Gender
              </label>
              <div className="relative">
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner appearance-none"
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="favoriteCategory" className="text-sm font-medium text-slate-300">
                Favorite Market Category
              </label>
              <div className="relative">
                <select
                  id="favoriteCategory"
                  value={favoriteCategory}
                  onChange={(e) => setFavoriteCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner appearance-none"
                >
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Clothing & Accessories">Clothing & Accessories</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Gadgets & Electronics">Gadgets & Electronics</option>
                  <option value="Arts & Crafts">Arts & Crafts</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-300">Dietary Preferences</label>
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dietaryPreferences.halal}
                    onChange={(e) => setDietaryPreferences({ ...dietaryPreferences, halal: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-purple-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Halal</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dietaryPreferences.vegetarian}
                    onChange={(e) => setDietaryPreferences({ ...dietaryPreferences, vegetarian: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-purple-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Vegetarian</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={dietaryPreferences.noSeafood}
                    onChange={(e) => setDietaryPreferences({ ...dietaryPreferences, noSeafood: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-purple-500 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">No Seafood</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 pb-2 mt-2">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-300">Notifications</label>
                <p className="text-xs text-slate-500">Receive Live Market Schedule Updates</p>
              </div>
              <button
                type="button"
                onClick={() => setLiveUpdates(!liveUpdates)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-opacity-75 ${
                  liveUpdates ? "bg-purple-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    liveUpdates ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </form>
        </div>

        {/* Anchored Buttons at the Bottom */}
        <div className="p-6 sm:px-8 sm:pb-8 sm:pt-4 bg-slate-900 border-t border-slate-800 shrink-0 z-10">
          <button
            type="submit"
            form="profile-form"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
