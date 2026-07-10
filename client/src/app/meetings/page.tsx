"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Play, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/lib/axios";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatScheduledAt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isoToDateInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function isoToTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MeetingsPage() {
  const isAuthed = useRequireAuth();
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [pmi, setPmi] = useState<Meeting | null>(null);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDurationHours, setEditDurationHours] = useState(0);
  const [editDurationMinutes, setEditDurationMinutes] = useState(0);
  const [editPasscodeEnabled, setEditPasscodeEnabled] = useState(false);
  const [editPasscode, setEditPasscode] = useState("");
  const [editWaitingRoom, setEditWaitingRoom] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/meetings");
      const data = res.data.data;
      setUpcoming(data.upcoming);
      setPmi(data.pmi);
      setSelected((prev) => prev ?? data.pmi ?? data.upcoming[0] ?? null);
    } catch {
      // Request failed - empty state shows.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  if (!isAuthed) {
    return null;
  }

  function selectMeeting(m: Meeting) {
    setSelected(m);
    setShowInvite(false);
  }

  function copyInvite(m: Meeting) {
    navigator.clipboard.writeText(m.invite_link);
    toast.success("Invitation copied");
  }

  function openEdit() {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditDescription(selected.description);
    if (selected.scheduled_at) {
      setEditDate(isoToDateInput(selected.scheduled_at));
      setEditTime(isoToTimeInput(selected.scheduled_at));
    }
    setEditDurationHours(Math.floor((selected.duration_min ?? 0) / 60));
    setEditDurationMinutes((selected.duration_min ?? 0) % 60);
    setEditPasscodeEnabled(!!selected.passcode);
    setEditPasscode(selected.passcode ?? "");
    setEditWaitingRoom(selected.waiting_room);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!selected) return;

    const payload: Record<string, unknown> = {
      title: editTitle,
      description: editDescription,
      passcode: editPasscodeEnabled ? editPasscode : null,
      waiting_room: editWaitingRoom,
    };
    if (selected.status === "scheduled" && editDate && editTime) {
      payload.scheduled_at = `${editDate}T${editTime}:00`;
      payload.duration_min = editDurationHours * 60 + editDurationMinutes;
    }

    try {
      setEditSaving(true);
      const res = await api.patch(`/meetings/${selected.meeting_code}`, payload);
      const updated: Meeting = res.data.data.meeting;
      toast.success("Meeting updated");
      setEditOpen(false);
      setSelected(updated);
      setUpcoming((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      if (pmi?.id === updated.id) setPmi(updated);
    } catch {
      toast.error("Couldn't update the meeting");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex w-80 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between p-4">
          <span className="rounded-full bg-zoom-blue/10 px-3 py-1 text-sm font-medium text-zoom-blue">
            Upcoming
          </span>
          <button
            type="button"
            onClick={load}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4">
          {pmi && (
            <button
              type="button"
              onClick={() => selectMeeting(pmi)}
              className={cn(
                "mb-2 w-full rounded-xl bg-zoom-blue p-4 text-left text-white shadow-sm transition",
                selected?.id === pmi.id && "ring-2 ring-zoom-blue ring-offset-2"
              )}
            >
              <p className="text-lg font-semibold">{pmi.meeting_code}</p>
              <p className="text-xs text-white/80">My Personal Meeting ID (PMI)</p>
            </button>
          )}

          {loading ? (
            <p className="py-4 text-sm text-gray-400">Loading...</p>
          ) : upcoming.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">No upcoming meetings</p>
          ) : (
            upcoming.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMeeting(m)}
                className={cn(
                  "mb-2 w-full rounded-xl border border-gray-100 p-3 text-left hover:bg-gray-50",
                  selected?.id === m.id && "border-zoom-blue bg-zoom-blue/5"
                )}
              >
                <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {formatScheduledAt(m.scheduled_at)}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="border-t p-4">
          <button
            type="button"
            onClick={() => toast("Calendar integration isn't available in this demo")}
            className="text-sm font-medium text-zoom-blue hover:underline"
          >
            Add a calendar
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-10">
        {selected ? (
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-semibold text-gray-900">{selected.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{selected.meeting_code}</p>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => router.push(`/meeting/${selected.meeting_code}`)}
                className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Start
              </Button>
              <Button variant="outline" onClick={() => copyInvite(selected)}>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Invitation
              </Button>
              <Button variant="outline" onClick={openEdit}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowInvite((v) => !v)}
              className="mt-6 text-sm font-medium text-zoom-blue hover:underline"
            >
              {showInvite ? "Hide Meeting Invitation" : "Show Meeting Invitation"}
            </button>

            {showInvite && (
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-left text-sm text-gray-600">
                <p>Meeting ID: {selected.meeting_code}</p>
                {selected.passcode && <p>Passcode: {selected.passcode}</p>}
                <p className="mt-2 break-all text-zoom-blue">{selected.invite_link}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No upcoming meetings</p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit meeting</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="editTitle" className="text-sm font-medium text-gray-700">
                Topic
              </label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="editDescription" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="editDescription"
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {selected?.status === "scheduled" && (
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Checkbox
                id="editPasscodeEnabled"
                checked={editPasscodeEnabled}
                onCheckedChange={(v) => setEditPasscodeEnabled(!!v)}
              />
              <label htmlFor="editPasscodeEnabled" className="text-sm text-gray-700">
                Passcode
              </label>
              {editPasscodeEnabled && (
                <Input
                  value={editPasscode}
                  onChange={(e) => setEditPasscode(e.target.value)}
                  className="w-32"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="editWaitingRoom"
                checked={editWaitingRoom}
                onCheckedChange={(v) => setEditWaitingRoom(!!v)}
              />
              <label htmlFor="editWaitingRoom" className="text-sm text-gray-700">
                Waiting Room
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={editSaving}
              className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
            >
              {editSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
