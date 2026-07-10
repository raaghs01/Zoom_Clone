"use client";

import { MicOff, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { Participant } from "@/lib/types";

interface ParticipantsPanelProps {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  isHost: boolean;
  myParticipantId: number | null;
  pendingIds: number[];
  mutingAll: boolean;
  onMuteOne: (id: number) => void;
  onMuteAll: () => void;
  onRemoveOne: (id: number) => void;
}

export function ParticipantsPanel({
  open,
  onClose,
  participants,
  isHost,
  myParticipantId,
  pendingIds,
  mutingAll,
  onMuteOne,
  onMuteAll,
  onRemoveOne,
}: ParticipantsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-white/10 bg-[#1c1c1c] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold">Participants ({participants.length})</h2>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {participants.map((p) => {
          const isMe = p.id === myParticipantId;
          const label =
            p.role === "host" ? (isMe ? " (Host, me)" : " (Host)") : isMe ? " (me)" : "";
          const isPending = pendingIds.includes(p.id);

          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-avatar-green text-xs font-semibold">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">
                  {p.display_name}
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {p.is_muted && <MicOff className="h-4 w-4 text-red-400" />}
                {isHost && p.role !== "host" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onMuteOne(p.id)}
                      disabled={isPending}
                      className="text-xs text-gray-300 hover:text-white hover:underline disabled:pointer-events-none disabled:opacity-50"
                    >
                      Mute
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveOne(p.id)}
                      disabled={isPending}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline disabled:pointer-events-none disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast("Invite isn't available in this demo")}
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          Invite
        </Button>
        {isHost && (
          <Button
            size="sm"
            onClick={onMuteAll}
            disabled={mutingAll}
            className="bg-zoom-blue text-white hover:bg-zoom-blue/90"
          >
            {mutingAll ? "Muting..." : "Mute All"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast("Nothing more to see here (demo)")}
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          More
        </Button>
      </div>
    </div>
  );
}
