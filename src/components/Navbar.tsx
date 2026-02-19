import { FC } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, BookOpen, Play, Building2, Trophy, Gamepad2, User, LogIn, LogOut, Shield, LayoutDashboard, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [{
  icon: Home,
  label: "Home",
  path: "/"
}, {
  icon: FileText,
  label: "Tests",
  path: "/tests"
}, {
  icon: BookOpen,
  label: "Courses",
  path: "/courses"
}, {
  icon: Play,
  label: "Reels",
  path: "/reels"
}, {
  icon: Building2,
  label: "Centers",
  path: "/centers"
}, {
  icon: Trophy,
  label: "Olympiads",
  path: "/olympiads"
}, {
  icon: Gamepad2,
  label: "Games",
  path: "/games"
}];
export const Navbar: FC = () => {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    data: role
  } = useUserRole();
  const handleSignOut = async () => {
    await signOut();
  };
  return <>
      {/* Desktop Navbar */}
      <motion.header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-6 bg-card border-b border-border" initial={{
      y: -100
    }} animate={{
      y: 0
    }} transition={{
      type: "spring",
      stiffness: 300,
      damping: 30
    }}>
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
              <BookOpen className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-xl font-bold text-primary">​Doppi</span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path}>
                  <motion.div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>;
          })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer" whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
                  <span className="text-sm font-bold text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/test-history" className="cursor-pointer">
                    <History className="mr-2 h-4 w-4" />
                    Test History
                  </Link>
                </DropdownMenuItem>
                {role === 'admin' && <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>}
                {role === 'center' && <DropdownMenuItem asChild>
                    <Link to="/center-panel" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Center Panel
                    </Link>
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Link to="/auth">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>}
        </div>
      </motion.header>

      {/* Mobile Bottom Navigation */}
      <motion.nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border" initial={{
      y: 100
    }} animate={{
      y: 0
    }} transition={{
      type: "spring",
      stiffness: 300,
      damping: 30
    }}>
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path}>
                <motion.div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} whileTap={{
              scale: 0.9
            }}>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              </Link>;
        })}
        </div>
      </motion.nav>

      {/* Mobile Top Bar */}
      <motion.header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-card border-b border-border" initial={{
      y: -100
    }} animate={{
      y: 0
    }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-primary">IMTS.uz</span>
        </Link>

        {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <span className="text-xs font-bold text-primary-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/test-history">Test History</Link>
              </DropdownMenuItem>
              {role === 'admin' && <DropdownMenuItem asChild>
                  <Link to="/admin">Admin Panel</Link>
                </DropdownMenuItem>}
              {role === 'center' && <DropdownMenuItem asChild>
                  <Link to="/center-panel">Center Panel</Link>
                </DropdownMenuItem>}
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <Link to="/auth">
            <Button variant="default" size="sm">
              <LogIn className="w-4 h-4" />
            </Button>
          </Link>}
      </motion.header>
    </>;
};