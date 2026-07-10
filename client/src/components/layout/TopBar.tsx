"use client";

import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const initial = user?.full_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-meeting-dark">
          zoom <span className="font-normal text-gray-500">Workplace</span>
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-gray-100"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-gray-100"
            aria-label="Forward"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 hover:bg-gray-100"
            aria-label="History"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-400">
          <Search className="h-4 w-4" />
          <span>Search</span>
          <span className="ml-auto text-xs">Ctrl+K</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="rounded-full">
          Upgrade to Pro
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-avatar-green text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
