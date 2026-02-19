import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  GraduationCap, 
  Play, 
  Building2, 
  Trophy,
  Gamepad2
} from "lucide-react";

const navItems = [
  {
    label: "Tests",
    icon: BookOpen,
    path: "/tests",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Courses",
    icon: GraduationCap,
    path: "/courses",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Reels",
    icon: Play,
    path: "/reels",
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  {
    label: "Centers",
    icon: Building2,
    path: "/centers",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Olympiads",
    icon: Trophy,
    path: "/olympiads",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Games",
    icon: Gamepad2,
    path: "/games",
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
  },
];

export const QuickNavigation: FC = () => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {navItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link
            to={item.path}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl ${item.bgColor} hover:scale-105 transition-transform group`}
          >
            <div className={`p-3 rounded-full bg-gradient-to-br ${item.color} text-white shadow-lg`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-medium ${item.textColor}`}>
              {item.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
