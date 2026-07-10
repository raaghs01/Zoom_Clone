"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/lib/axios";

function randomPasscode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function SchedulePage() {
  const isAuthed = useRequireAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [time, setTime] = useState("11:00");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [meetingIdOption, setMeetingIdOption] = useState<"auto" | "pmi">("auto");
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);
  const [passcode, setPasscode] = useState(randomPasscode);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthed) {
    return null;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Topic is required");
      return;
    }

    const scheduledAt = `${date}T${time}:00`;
    const durationMin = Number(durationHours) * 60 + Number(durationMinutes);
    if (durationMin <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      await api.post("/meetings/schedule", {
        title: title.trim(),
        description: description.trim(),
        scheduled_at: scheduledAt,
        duration_min: durationMin,
        passcode: passcodeEnabled ? passcode : null,
        waiting_room: waitingRoom,
      });
      toast.success("Meeting scheduled");
      router.push("/meetings");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.errors?.[0]?.message ?? err.response?.data?.message
        : undefined;
      toast.error(message ?? "Couldn't schedule the meeting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 overflow-auto p-8">
      <h1 className="text-xl font-semibold text-gray-900">Schedule Meeting</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Topic
          </label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {showDescription ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="self-start text-sm font-medium text-zoom-blue hover:underline"
          >
            + Add Description
          </button>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">When</span>
          <div className="flex flex-wrap gap-3">
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Duration</span>
          <div className="flex flex-wrap gap-3">
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h} hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 15, 30, 45].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Meeting ID</span>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="meetingIdOption"
              checked={meetingIdOption === "auto"}
              onChange={() => setMeetingIdOption("auto")}
            />
            Generate Automatically
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="meetingIdOption"
              checked={meetingIdOption === "pmi"}
              onChange={() => setMeetingIdOption("pmi")}
            />
            Personal Meeting ID
          </label>
          {meetingIdOption === "pmi" && (
            <p className="text-xs text-gray-400">
              This demo always generates a new meeting ID for scheduled meetings.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <span className="text-sm font-medium text-gray-700">Security</span>
          <div className="flex items-center gap-3">
            <Checkbox
              id="passcodeEnabled"
              checked={passcodeEnabled}
              onCheckedChange={(v) => setPasscodeEnabled(!!v)}
            />
            <label htmlFor="passcodeEnabled" className="text-sm text-gray-700">
              Passcode
            </label>
            {passcodeEnabled && (
              <Input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-32"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="waitingRoom"
              checked={waitingRoom}
              onCheckedChange={(v) => setWaitingRoom(!!v)}
            />
            <label htmlFor="waitingRoom" className="text-sm text-gray-700">
              Waiting Room
            </label>
          </div>
        </div>

        <div className="flex justify-start gap-3 border-t pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
