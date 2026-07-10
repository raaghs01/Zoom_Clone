"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { api } from "@/lib/axios";
import type { Meeting, Participant } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const POLL_INTERVAL_MS = 4000;

function StageTile({ participant, isMe }: { participant: Participant; isMe: boolean }) {
  return (
    <div className="relative flex aspect-video items-center justify-center rounded-xl bg-[#232323]">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-avatar-green text-2xl font-semibold text-white">
        {participant.display_name.charAt(0).toUpperCase()}
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/50 px-2 py-1 text-xs text-white">
        {participant.is_muted && <span className="text-red-400">●</span>}
        <span>
          {participant.display_name}
          {isMe ? " (me)" : ""}
        </span>
      </div>
    </div>
  );
}

function MeetingRoomInner() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pidFromQuery = searchParams.get("pid");
  const authUser = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const code = params.code;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [mutingAll, setMutingAll] = useState(false);
  const [ending, setEnding] = useState(false);

  const isHost = !!authUser && !!meeting && meeting.host.id === authUser.id;
  const myParticipantId = isHost
    ? participants.find((p) => p.role === "host")?.id ?? null
    : pidFromQuery
      ? Number(pidFromQuery)
      : null;

  const loadMeeting = useCallback(async () => {
    try {
      const res = await api.get(`/meetings/${code}`);
      setMeeting(res.data.data.meeting);
    } catch {
      setNotFound(true);
    }
  }, [code]);

  const loadParticipants = useCallback(async () => {
    try {
      const res = await api.get(`/meetings/${code}/participants`);
      setParticipants(
        (res.data.data.participants as Participant[]).filter((p) => !p.is_removed)
      );
    } catch {
      // ignore transient poll failures
    }
  }, [code]);

  useEffect(() => {
    loadMeeting();
    loadParticipants();
  }, [loadMeeting, loadParticipants]);

  useEffect(() => {
    const id = setInterval(loadParticipants, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadParticipants]);

  useEffect(() => {
    if (!meeting || !hasHydrated) return;
    if (!isHost && !pidFromQuery) {
      router.replace(`/join?code=${meeting.meeting_code}`);
    }
  }, [meeting, hasHydrated, isHost, pidFromQuery, router]);

  async function handleMuteOne(participantId: number) {
    setPendingIds((ids) => [...ids, participantId]);
    try {
      await api.post(`/meetings/${code}/participants/${participantId}/mute`);
      await loadParticipants();
    } catch {
      toast.error("Couldn't mute that participant");
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== participantId));
    }
  }

  async function handleMuteAll() {
    setMutingAll(true);
    try {
      await api.post(`/meetings/${code}/participants/mute-all`);
      toast.success("All participants muted");
      await loadParticipants();
    } catch {
      toast.error("Couldn't mute all participants");
    } finally {
      setMutingAll(false);
    }
  }

  async function handleRemoveOne(participantId: number) {
    setPendingIds((ids) => [...ids, participantId]);
    try {
      await api.post(`/meetings/${code}/participants/${participantId}/remove`);
      await loadParticipants();
    } catch {
      toast.error("Couldn't remove that participant");
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== participantId));
    }
  }

  async function handleEnd() {
    setEnding(true);
    try {
      await api.post(`/meetings/${code}/end`);
    } catch {
      // best-effort; still return to the dashboard
    } finally {
      router.push("/");
    }
  }

  function handleLeave() {
    router.push("/");
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-meeting-dark text-white">
        <p>This meeting doesn&apos;t exist or has ended.</p>
        <Button
          onClick={() => router.push("/")}
          className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-screen items-center justify-center bg-meeting-dark text-white">
        Loading...
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex h-screen items-center justify-center bg-meeting-dark p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zoom-blue/10 text-2xl">
            🎥
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Do you want people to see you in the meeting?
          </h2>
          <p className="mt-1 text-sm text-gray-500">{meeting.title}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => {
                setMicOn(true);
                setCamOn(true);
                setJoined(true);
              }}
              className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
            >
              Use microphone and camera
            </Button>
            <button
              type="button"
              onClick={() => {
                setMicOn(false);
                setCamOn(false);
                setJoined(true);
              }}
              className="text-sm font-medium text-zoom-blue hover:underline"
            >
              Continue without microphone and camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-meeting-dark">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-4 text-xs text-gray-300">
        <span className="font-medium text-white">zoom Workplace</span>
        <span className="rounded bg-white/10 px-2 py-0.5">{meeting.title}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div
            className={`grid h-full gap-4 ${
              participants.length <= 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {participants.map((p) => (
              <StageTile key={p.id} participant={p} isMe={p.id === myParticipantId} />
            ))}
          </div>
        </div>

        <ParticipantsPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          participants={participants}
          isHost={isHost}
          myParticipantId={myParticipantId}
          pendingIds={pendingIds}
          mutingAll={mutingAll}
          onMuteOne={handleMuteOne}
          onMuteAll={handleMuteAll}
          onRemoveOne={handleRemoveOne}
        />
      </div>

      <ControlBar
        micOn={micOn}
        camOn={camOn}
        onToggleMic={() => setMicOn((v) => !v)}
        onToggleCam={() => setCamOn((v) => !v)}
        participantCount={participants.length}
        onOpenParticipants={() => setPanelOpen((v) => !v)}
        isHost={isHost}
        ending={ending}
        onEnd={handleEnd}
        onLeave={handleLeave}
      />
    </div>
  );
}

export default function MeetingRoomPage() {
  return (
    <Suspense fallback={null}>
      <MeetingRoomInner />
    </Suspense>
  );
}
