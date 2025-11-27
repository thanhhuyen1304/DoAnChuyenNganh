import { Button } from "@/components/ui/button"
import { Users, Swords, Clock } from "lucide-react"

// Mock data for rooms
const ROOMS = [
  {
    id: 1,
    host: "AlexChen",
    hostAvatar: "AC",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    status: "OPEN",
    players: 1,
  },
  {
    id: 2,
    host: "Sarah_Dev",
    hostAvatar: "SD",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    status: "IN_MATCH",
    opponent: "CodeNinja",
    players: 2,
  },
  {
    id: 3,
    host: "AlgorithmMaster",
    hostAvatar: "AM",
    topic: "Graph Theory",
    difficulty: "Hard",
    status: "OPEN",
    players: 1,
  },
  {
    id: 4,
    host: "Pythonista",
    hostAvatar: "PY",
    topic: "String Manipulation",
    difficulty: "Medium",
    status: "IN_MATCH",
    opponent: "JavaJunkie",
    players: 2,
  },
  {
    id: 5,
    host: "NewbieCoder",
    hostAvatar: "NC",
    topic: "Basic Math",
    difficulty: "Easy",
    status: "OPEN",
    players: 1,
  },
]

export function RoomList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Active Rooms
          <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
            {ROOMS.length}
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" /> In Match
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROOMS.map((room) => (
          <div
            key={room.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
          >
            {/* Status Bar */}
            <div
              className={`absolute top-0 left-0 w-1 h-full transition-colors ${
                room.status === "OPEN" ? "bg-primary" : "bg-accent"
              }`}
            />

            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      room.difficulty === "Easy"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : room.difficulty === "Medium"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}
                  >
                    {room.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary border border-border">
                    {room.topic}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {room.status === "OPEN" ? `${room.host}'s Room` : `${room.host} vs ${room.opponent}`}
                </h3>
              </div>

              {room.status === "OPEN" ? (
                <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Waiting
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                  <Swords className="w-3 h-3" />
                  In Match
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {room.hostAvatar}
                </div>
                {room.status === "IN_MATCH" && (
                  <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground">
                    VS
                  </div>
                )}
                {room.status === "OPEN" && (
                  <div className="w-8 h-8 rounded-full bg-card border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Users className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {room.status === "OPEN" ? (
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Join Room
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-muted-foreground cursor-not-allowed opacity-80"
                  disabled
                >
                  Full
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}