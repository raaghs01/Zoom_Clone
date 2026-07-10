"use client";

import { useEffect, useState } from "react";

import { ActionTiles } from "@/components/meeting/ActionTiles";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { api } from "@/lib/axios";
import type { Meeting } from "@/lib/types";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export default function Home() {
  const now = useClock();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [pmi, setPmi] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get("/meetings");
        if (cancelled) return;
        setUpcoming(res.data.data.upcoming);
        setRecent(res.data.data.recent);
        setPmi(res.data.data.pmi);
      } catch {
        // Not logged in yet or request failed - dashboard just shows empty sections.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const time = now?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) ?? "";
  const date =
    now?.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) ?? "";

  return (
    <div className="flex h-full flex-col items-center gap-10 overflow-auto p-10">
      <div className="flex flex-col items-center gap-1 pt-6">
        <span className="text-6xl font-light text-gray-900">{time}</span>
        <span className="text-sm text-gray-500">{date}</span>
      </div>

      <ActionTiles pmi={pmi} />

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Upcoming meetings</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming meetings</p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Recent meetings</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-gray-400">No recent meetings</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
