export interface MeetingHost {
  id: number;
  full_name: string;
  username: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string;
  status: "instant" | "scheduled";
  scheduled_at: string | null;
  duration_min: number | null;
  passcode: string | null;
  waiting_room: boolean;
  is_active: boolean;
  invite_link: string;
  created_at: string;
  host: MeetingHost;
}

export interface Participant {
  id: number;
  display_name: string;
  role: "host" | "participant";
  is_muted: boolean;
  is_removed: boolean;
  joined_at: string;
  left_at: string | null;
}
