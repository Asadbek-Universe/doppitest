import { FC } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Target, Flame, Coins, BarChart3, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const forYouItems = [
  { title: "Advanced Math Test", subtitle: "Based on your progress", bgColor: "bg-accent/20" },
  { title: "Physics Course", subtitle: "Recommended for you", bgColor: "bg-muted" },
];

const trendingItems = [
  { tag: "#mathematics", count: "12.5k" },
  { tag: "#physics", count: "8.2k" },
  { tag: "#olympiad2024", count: "5.1k" },
];

const quickActions = [
  { icon: Coins, label: "Coin Store", value: "100" },
  { icon: BarChart3, label: "Rankings", value: null },
  { icon: Gamepad2, label: "Play Games", value: null },
];

export const RightSidebar: FC = () => {
  return (
    <aside className="space-y-6">
      {/* For You */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            For You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {forYouItems.map((item, index) => (
            <motion.div
              key={item.title}
              className={`p-4 rounded-xl ${item.bgColor} cursor-pointer hover:opacity-80 transition-opacity`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4 className="font-semibold text-foreground">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Trending */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingItems.map((item) => (
            <div key={item.tag} className="flex items-center justify-between">
              <span className="font-medium text-primary">{item.tag}</span>
              <span className="text-sm text-muted-foreground">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* My Progress */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-xp" />
            My Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streak */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-streak" />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <div className="text-3xl font-bold text-primary">70 days</div>
          </div>

          {/* Tests Completed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tests Completed: 24/100</span>
            </div>
            <Progress value={24} className="h-2" />
          </div>

          {/* Lessons Watched */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Lessons Watched: 45/200</span>
            </div>
            <Progress value={22.5} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{action.label}</span>
              </div>
              {action.value && (
                <span className="font-bold text-primary">{action.value}</span>
              )}
            </motion.button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
};
