import { FC } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, BookOpen, Play, Building2, Trophy, Gamepad2, User, LogIn, LogOut, Shield, LayoutDashboard, History, Settings } from "lucide-react";
import doppiLogo from "@/assets/doppi-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: BookOpen, labelKey: "nav.courses", path: "/courses" },
  { icon: FileText, labelKey: "nav.tests", path: "/tests" },
  { icon: Trophy, labelKey: "nav.olympiads", path: "/olympiads" },
  { icon: Gamepad2, labelKey: "nav.games", path: "/games" },
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Play, labelKey: "nav.reels", path: "/reels" },
  { icon: Building2, labelKey: "nav.centers", path: "/centers" },
];
export const Navbar: FC = () => {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    data: role
  } = useUserRole();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
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
            <motion.div className="flex items-center justify-center shrink-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <img src={doppiLogo} alt="Doppi" className="h-10 w-10 rounded-full object-contain" />
            </motion.div>
            <span className="text-xl font-bold text-primary hidden sm:inline">
              {t("brand.desktop")}
            </span>
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
                    <span>{t(item.labelKey)}</span>
                  </motion.div>
                </Link>;
          })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <Select
              value={language}
              onValueChange={(val) => setLanguage(val as any)}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="uz">UZ</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/test-history" className="cursor-pointer">
                    <History className="mr-2 h-4 w-4" />
                    {t("nav.testHistory")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile?tab=settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                {role === 'admin' && <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      {t("nav.adminPanel")}
                    </Link>
                  </DropdownMenuItem>}
                {role === 'center' && <DropdownMenuItem asChild>
                    <Link to="/center-panel" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t("nav.centerPanel")}
                    </Link>
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Link to="/auth">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                {t("nav.signIn")}
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
                  <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
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
          <img src={doppiLogo} alt="Doppi" className="h-8 w-8 rounded-full object-contain" />
          <span className="text-lg font-bold text-primary">
            {t("brand.mobile")}
          </span>
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
                <Link to="/profile">{t("nav.profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/test-history">{t("nav.testHistory")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile?tab=settings">{t("nav.settings")}</Link>
              </DropdownMenuItem>
              {role === 'admin' && <DropdownMenuItem asChild>
                  <Link to="/admin">{t("nav.adminPanel")}</Link>
                </DropdownMenuItem>}
              {role === 'center' && <DropdownMenuItem asChild>
                  <Link to="/center-panel">{t("nav.centerPanel")}</Link>
                </DropdownMenuItem>}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
                {t("nav.signOut")}
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