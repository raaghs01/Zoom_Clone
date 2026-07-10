"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  MessageSquare,
  MoreHorizontal,
  Settings,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

function NavTile({
  label,
  icon: Icon,
  active,
  href,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors sm:px-3",
        active
          ? "bg-white text-zoom-blue shadow-sm"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="focus:outline-none">
      {content}
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center justify-between bg-white/60 py-4 sm:w-[88px]">
      <div className="flex flex-col items-center gap-2">
        <NavTile label="Home" icon={Home} active={pathname === "/"} href="/" />
        <NavTile
          label="Meetings"
          icon={Video}
          active={pathname.startsWith("/meetings")}
          href="/meetings"
        />
        <NavTile
          label="Chat"
          icon={MessageSquare}
          active={false}
          onClick={() => toast("Chat isn't available in this demo")}
        />
        <NavTile
          label="More"
          icon={MoreHorizontal}
          active={false}
          onClick={() => toast("Nothing more to see here (demo)")}
        />
      </div>
      <NavTile
        label="Settings"
        icon={Settings}
        active={false}
        onClick={() => toast("Settings isn't available in this demo")}
      />
    </aside>
  );
}
