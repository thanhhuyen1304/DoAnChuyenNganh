"use client"

import { useState } from "react"
import { Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data for friends
const FRIENDS = [
  { id: 1, name: "David Kim", status: "online", avatar: "DK" },
  { id: 2, name: "Maria Garcia", status: "online", avatar: "MG" },
  { id: 3, name: "James Wilson", status: "online", avatar: "JW" },
  { id: 4, name: "Lisa Chen", status: "offline", avatar: "LC" },
  { id: 5, name: "Robert Fox", status: "offline", avatar: "RF" },
  { id: 6, name: "Emma Watson", status: "offline", avatar: "EW" },
]

// Mock data for other online users
const OTHER_USERS = [
  { id: 101, name: "CodeWarrior", status: "online", avatar: "CW", language: "Python" },
  { id: 102, name: "JavaMaster", status: "online", avatar: "JM", language: "Java" },
  { id: 103, name: "RustAce", status: "online", avatar: "RA", language: "Rust" },
  { id: 104, name: "GoGopher", status: "online", avatar: "GG", language: "Go" },
  { id: 105, name: "CppWizard", status: "online", avatar: "CW", language: "C++" },
  { id: 106, name: "TypeScriptPro", status: "online", avatar: "TS", language: "TS" },
]

type Tab = "friends" | "active"

export function SocialPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("friends")

  const sortedFriends = [...FRIENDS].sort((a, b) => {
    if (a.status === "online" && b.status === "offline") return -1
    if (a.status === "offline" && b.status === "online") return 1
    return 0
  })

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[500px]">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === "friends"
              ? "text-primary bg-background"
              : "text-muted-foreground bg-secondary/30 hover:bg-secondary/50",
          )}
        >
          Friends
          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {FRIENDS.filter((f) => f.status === "online").length}
          </span>
          {activeTab === "friends" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === "active"
              ? "text-primary bg-background"
              : "text-muted-foreground bg-secondary/30 hover:bg-secondary/50",
          )}
        >
          Active Users
          <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {OTHER_USERS.length}
          </span>
          {activeTab === "active" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <div className="p-3 border-b border-border bg-background/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === "friends" ? "Search friends..." : "Search users..."}
            className="w-full h-9 rounded-md border border-input bg-secondary/50 px-8 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === "friends" ? (
          <>
            {sortedFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground border border-border">
                      {friend.avatar}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        friend.status === "online" ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {friend.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{friend.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {OTHER_USERS.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-bold text-foreground border border-border/50">
                      {user.avatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-primary animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                      {user.language}
                    </span>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Add Friend"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Add friend</span>
                </Button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-3 border-t border-border bg-secondary/20">
        <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center gap-1">
          {activeTab === "friends" ? "View all friends" : "View all active users"}
        </button>
      </div>
    </div>
  )
}