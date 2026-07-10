import { Video } from "lucide-react";

import type { Meeting } from "@/lib/types";

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

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const scheduled = formatScheduledAt(meeting.scheduled_at);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zoom-blue/10 text-zoom-blue">
        <Video className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{meeting.title}</p>
        <p className="truncate text-xs text-gray-500">{scheduled ?? meeting.meeting_code}</p>
      </div>
    </div>
  );
}
