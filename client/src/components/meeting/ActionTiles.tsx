"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Loader2, Plus, Video } from "lucide-react";
import toast from "react-hot-toast";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/axios";
import type { Meeting } from "@/lib/types";

interface ActionTilesProps {
  pmi: Meeting | null;
}

export function ActionTiles({ pmi }: ActionTilesProps) {
  const router = useRouter();
  const [usePmi, setUsePmi] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleNewMeeting() {
    if (usePmi && pmi) {
      router.push(`/meeting/${pmi.meeting_code}`);
      return;
    }

    try {
      setCreating(true);
      const res = await api.post("/meetings/instant", {});
      router.push(`/meeting/${res.data.data.meeting.meeting_code}`);
    } catch {
      toast.error("Couldn't start the meeting. Try again.");
    } finally {
      setCreating(false);
    }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewMeeting}
            disabled={creating}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zoom-orange text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Video className="h-6 w-6" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
                aria-label="New meeting options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={usePmi}
                onCheckedChange={setUsePmi}
                disabled={!pmi}
              >
                Use my Personal Meeting ID (PMI)
              </DropdownMenuCheckboxItem>
              {pmi && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>{pmi.meeting_code}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => copyText(pmi.meeting_code, "Meeting ID")}
                    >
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => copyText(pmi.invite_link, "Invitation")}
                    >
                      Copy Invitation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toast("PMI Settings isn't available in this demo")}
                    >
                      PMI Settings
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="text-sm font-medium text-gray-700">New meeting</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/join")}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zoom-blue text-white shadow-sm transition hover:brightness-95"
        >
          <Plus className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-gray-700">Join</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/schedule")}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zoom-blue text-white shadow-sm transition hover:brightness-95"
        >
          <Calendar className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-gray-700">Schedule</span>
      </div>
    </div>
  );
}
