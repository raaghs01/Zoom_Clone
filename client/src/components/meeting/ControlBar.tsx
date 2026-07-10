"use client";

import type { ElementType } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  Smile,
  ScreenShare,
  Shield,
  Sparkles,
  MoreHorizontal,
  PhoneOff,
} from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

interface ControlBarProps {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  participantCount: number;
  onOpenParticipants: () => void;
  isHost: boolean;
  ending: boolean;
  onEnd: () => void;
  onLeave: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  muted,
}: {
  icon: ElementType;
  label: string;
  onClick?: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-gray-300 hover:bg-white/10 sm:px-3",
        muted && "text-red-400"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function placeholder(name: string) {
  toast(`${name} isn't available in this demo`);
}

export function ControlBar({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  participantCount,
  onOpenParticipants,
  isHost,
  ending,
  onEnd,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="flex h-20 shrink-0 items-center justify-between gap-2 overflow-x-auto bg-[#1c1c1c] px-2 sm:px-6">
      <div className="flex items-center gap-1">
        <ControlButton
          icon={micOn ? Mic : MicOff}
          label={micOn ? "Mute" : "Unmute"}
          onClick={onToggleMic}
          muted={!micOn}
        />
        <ControlButton
          icon={camOn ? Video : VideoOff}
          label={camOn ? "Stop Video" : "Start Video"}
          onClick={onToggleCam}
          muted={!camOn}
        />
      </div>

      <div className="flex items-center gap-1">
        <ControlButton
          icon={Users}
          label={`Participants (${participantCount})`}
          onClick={onOpenParticipants}
        />
        <ControlButton icon={MessageSquare} label="Chat" onClick={() => placeholder("Chat")} />
        <ControlButton icon={Smile} label="React" onClick={() => placeholder("React")} />
        <ControlButton icon={ScreenShare} label="Share" onClick={() => placeholder("Share")} />
        {isHost && (
          <ControlButton
            icon={Shield}
            label="Host tools"
            onClick={() => placeholder("Host tools")}
          />
        )}
        <ControlButton icon={Sparkles} label="Zoom AI" onClick={() => placeholder("Zoom AI")} />
        <ControlButton icon={MoreHorizontal} label="More" onClick={() => placeholder("More")} />
      </div>

      <button
        type="button"
        onClick={isHost ? onEnd : onLeave}
        disabled={ending}
        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        <PhoneOff className="h-4 w-4" />
        {isHost ? (ending ? "Ending..." : "End") : "Leave"}
      </button>
    </div>
  );
}
