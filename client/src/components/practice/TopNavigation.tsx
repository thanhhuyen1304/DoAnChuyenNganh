// "use client"

// import { Settings, User, Trophy, Home } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { useNavigate } from "react-router-dom"
// import { useEffect, useState } from "react"

// export function TopNavigation() {
//   const navigate = useNavigate()
//   const [user, setUser] = useState<any>(null)
//   const [xp, setXP] = useState(0)

//   useEffect(() => {
//     const userData = localStorage.getItem('user')
//     if (userData) {
//       const parsed = JSON.parse(userData)
//       setUser(parsed)
//       setXP(parsed.experience || 0)
//     }

//     // Listen for XP updates
//     const handleStorageChange = () => {
//       const updatedUser = localStorage.getItem('user')
//       if (updatedUser) {
//         const parsed = JSON.parse(updatedUser)
//         setUser(parsed)
//         setXP(parsed.experience || 0)
//       }
//     }

//     window.addEventListener('storage', handleStorageChange)
//     // Custom event để cập nhật XP khi submit thành công
//     window.addEventListener('xpUpdated', handleStorageChange)

//     return () => {
//       window.removeEventListener('storage', handleStorageChange)
//       window.removeEventListener('xpUpdated', handleStorageChange)
//     }
//   }, [])

//   const handleProfileClick = () => {
//     navigate('/dashboard')
//   }

//   const handleHomeClick = () => {
//     navigate('/')
//   }

//   return (
//     <nav className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
//       <div className="flex items-center gap-3">
//         <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center cursor-pointer" onClick={handleHomeClick}>
//           <span className="text-white font-bold text-sm">BH</span>
//         </div>
//         <h1 className="text-lg font-bold text-foreground cursor-pointer" onClick={handleHomeClick}>BugHunter</h1>
//       </div>

//       <div className="flex items-center gap-4">
//         {/* XP Display */}
//         <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
//           <Trophy className="w-4 h-4 text-primary" />
//           <span className="text-sm font-medium text-foreground">{xp} XP</span>
//           {user?.rank && (
//             <span className="text-xs text-muted-foreground">({user.rank})</span>
//           )}
//         </div>

//         <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2" onClick={() => navigate('/achievements')}>
//           <Trophy className="w-4 h-4" />
//           <span>Thành tựu</span>
//         </Button>

//         <div className="flex items-center gap-2 pl-4 border-l border-border">
//           <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
//             <Settings className="w-4 h-4" />
//           </Button>

//           <Button variant="ghost" size="icon" onClick={handleProfileClick}>
//             <User className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     </nav>
//   )
// }

