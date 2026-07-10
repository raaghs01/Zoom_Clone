"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setMeetingId(code);
  }, [searchParams]);

  const canJoin = meetingId.trim().length > 0 && displayName.trim().length > 0;

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!canJoin) return;

    try {
      setLoading(true);
      const encoded = encodeURIComponent(meetingId.trim());
      await api.get(`/meetings/${encoded}`);
      const res = await api.post(`/meetings/${encoded}/join`, {
        display_name: displayName.trim(),
      });
      router.push(`/meeting/${res.data.data.meeting.meeting_code}`);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error(message ?? "Couldn't find that meeting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Join Meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meetingId" className="text-sm font-medium text-gray-700">
                Meeting ID or Personal Link Name
              </label>
              <Input
                id="meetingId"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                placeholder="123 456 7890 or invite link"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                Your Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canJoin || loading}
                className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
              >
                {loading ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}
