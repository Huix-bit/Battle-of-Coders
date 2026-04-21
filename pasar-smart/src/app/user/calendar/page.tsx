"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";

function CalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventName = searchParams.get("eventName");
  const marketDateParam = searchParams.get("marketDate");
  const marketLocation = searchParams.get("marketLocation");

  const [showToast, setShowToast] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (eventName && marketDateParam) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      
      const parsedDate = new Date(marketDateParam);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
      }

      return () => clearTimeout(timer);
    }
  }, [eventName, marketDateParam]);

  // --- Notification Polling Logic ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 1. Request Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then(async (permission) => {
        if (permission === "granted") {
          // Fetch user's saved events from Supabase
          const { data: { user } } = await supabase.auth.getUser();
          
          let savedEvents: any[] = [];
          if (user) {
            // Assumed table name for market events
            const { data } = await supabase
              .from("saved_events")
              .select("*")
              .eq("user_id", user.id);
            if (data) savedEvents = data;
          }

          // 2. The Listener (Polling)
          intervalId = setInterval(() => {
            const now = new Date();
            
            if (savedEvents && savedEvents.length > 0) {
              savedEvents.forEach((event) => {
                const eventTime = new Date(event.start_time);
                // Check if current time matches event time (within a 1 minute window)
                const diffInMinutes = Math.abs(now.getTime() - eventTime.getTime()) / 1000 / 60;
                
                if (diffInMinutes <= 1) {
                  // 3. Trigger the Notification
                  new Notification("Pasar-Smart: Market Starting!", {
                    body: `The ${event.event_name || "Event"} at ${event.location || "the market"} is starting now.`,
                    icon: "/favicon.ico",
                  });
                }
              });
            } else if (eventName && marketDateParam) {
              // Fallback for hackathon demo purposes using URL params
              // Assuming event time is 18:00 (6:00 PM) for the mock date
              const eventDate = new Date(marketDateParam);
              eventDate.setHours(18, 0, 0, 0);

              const diffInMinutes = Math.abs(now.getTime() - eventDate.getTime()) / 1000 / 60;
              if (diffInMinutes <= 1) {
                new Notification("Pasar-Smart: Market Starting!", {
                  body: `The ${eventName} at ${marketLocation || "the market"} is starting now.`,
                  icon: "/favicon.ico",
                });
              }
            }
          }, 60000);
        }
      });
    }

    // 4. Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [eventName, marketDateParam, marketLocation]);

  // Generate calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const targetDate = useMemo(() => {
    if (marketDateParam) {
      const d = new Date(marketDateParam);
      if (!isNaN(d.getTime())) {
        return {
          date: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear()
        };
      }
    }
    return null;
  }, [marketDateParam]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-6 py-3 rounded-full shadow-lg backdrop-blur-md font-semibold text-sm flex items-center gap-2">
            <span>✅</span> Reminder is saved!
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => router.back()} className="hover:text-slate-200 transition-colors">
            Back
          </button>
          <span>/</span>
          <span className="text-slate-200">Personal Calendar</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_#4c1d95_0%,_transparent_60%)] opacity-30 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {monthName} {year}
            </h1>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                &larr;
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-800/50 rounded-xl overflow-hidden border border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-900/80 p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-900/40 p-4 min-h-[100px]" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isTargetDay = targetDate && 
                targetDate.date === dayNum && 
                targetDate.month === currentDate.getMonth() && 
                targetDate.year === currentDate.getFullYear();

              return (
                <div 
                  key={dayNum} 
                  className={`bg-slate-900 p-2 sm:p-3 min-h-[100px] border-t border-l border-slate-800/50 relative transition-colors ${isTargetDay ? 'bg-purple-900/20' : 'hover:bg-slate-800/50'}`}
                >
                  <span className={`text-sm font-medium ${isTargetDay ? 'text-purple-400' : 'text-slate-300'}`}>
                    {dayNum}
                  </span>
                  
                  {isTargetDay && (
                    <div className="mt-2 text-xs">
                      <div className="bg-purple-500 text-white font-semibold px-2 py-1 rounded-md shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400 truncate cursor-help" title={`${eventName}\n${marketLocation}`}>
                        {eventName}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Calendar...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
