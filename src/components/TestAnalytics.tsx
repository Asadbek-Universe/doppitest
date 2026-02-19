import { FC, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from "recharts";
import { format } from "date-fns";

interface TestAttempt {
  id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_points: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  skipped_answers: number | null;
  status: string;
  tests: {
    title: string;
    difficulty: number;
    is_official: boolean | null;
  } | null;
}

interface TestAnalyticsProps {
  attempts: TestAttempt[];
}

const COLORS = {
  primary: "hsl(var(--primary))",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  orange: "#f97316",
  blue: "#3b82f6",
  purple: "#a855f7",
  muted: "hsl(var(--muted-foreground))",
};

const PIE_COLORS = [COLORS.green, COLORS.red, COLORS.yellow];

export const TestAnalytics: FC<TestAnalyticsProps> = ({ attempts }) => {
  const completedAttempts = useMemo(() => 
    attempts.filter((a) => a.status === "completed"),
    [attempts]
  );

  // Score trend data (last 10 attempts, chronological order)
  const scoreTrendData = useMemo(() => {
    return completedAttempts
      .slice(0, 15)
      .reverse()
      .map((attempt, idx) => {
        const percentage = attempt.total_points 
          ? Math.round((attempt.score || 0) / attempt.total_points * 100) 
          : 0;
        return {
          name: format(new Date(attempt.started_at), "MMM d"),
          score: percentage,
          test: attempt.tests?.title?.substring(0, 20) || "Test",
          index: idx + 1,
        };
      });
  }, [completedAttempts]);

  // Performance breakdown (correct/wrong/skipped)
  const performanceData = useMemo(() => {
    const totals = completedAttempts.reduce(
      (acc, a) => ({
        correct: acc.correct + (a.correct_answers || 0),
        wrong: acc.wrong + (a.wrong_answers || 0),
        skipped: acc.skipped + (a.skipped_answers || 0),
      }),
      { correct: 0, wrong: 0, skipped: 0 }
    );
    
    const total = totals.correct + totals.wrong + totals.skipped;
    if (total === 0) return [];
    
    return [
      { name: "Correct", value: totals.correct, percentage: Math.round((totals.correct / total) * 100) },
      { name: "Wrong", value: totals.wrong, percentage: Math.round((totals.wrong / total) * 100) },
      { name: "Skipped", value: totals.skipped, percentage: Math.round((totals.skipped / total) * 100) },
    ];
  }, [completedAttempts]);

  // Difficulty performance
  const difficultyData = useMemo(() => {
    const byDifficulty: Record<string, { count: number; totalScore: number }> = {
      Easy: { count: 0, totalScore: 0 },
      Medium: { count: 0, totalScore: 0 },
      Hard: { count: 0, totalScore: 0 },
    };

    completedAttempts.forEach((a) => {
      if (!a.tests) return;
      const difficulty = a.tests.difficulty <= 2 ? "Easy" : a.tests.difficulty <= 4 ? "Medium" : "Hard";
      const percentage = a.total_points ? Math.round((a.score || 0) / a.total_points * 100) : 0;
      byDifficulty[difficulty].count++;
      byDifficulty[difficulty].totalScore += percentage;
    });

    return Object.entries(byDifficulty).map(([name, data]) => ({
      name,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      count: data.count,
      fill: name === "Easy" ? COLORS.green : name === "Medium" ? COLORS.orange : COLORS.red,
    }));
  }, [completedAttempts]);

  // Weekly progress data
  const weeklyProgress = useMemo(() => {
    const last7Days: Record<string, { count: number; totalScore: number }> = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = format(date, "EEE");
      last7Days[key] = { count: 0, totalScore: 0 };
    }

    completedAttempts.forEach((a) => {
      const attemptDate = new Date(a.started_at);
      const daysDiff = Math.floor((now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 6) {
        const key = format(attemptDate, "EEE");
        if (last7Days[key]) {
          const percentage = a.total_points ? Math.round((a.score || 0) / a.total_points * 100) : 0;
          last7Days[key].count++;
          last7Days[key].totalScore += percentage;
        }
      }
    });

    return Object.entries(last7Days).map(([day, data]) => ({
      day,
      tests: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    }));
  }, [completedAttempts]);

  if (completedAttempts.length < 2) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Complete at least 2 tests to see analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.test || label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-500" />
                Answer Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value} (${props.payload.percentage}%)`,
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {performanceData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                By Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% (${props.payload.count} tests)`,
                        "Avg Score"
                      ]}
                    />
                    <Bar 
                      dataKey="avgScore" 
                      radius={[4, 4, 0, 0]}
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {difficultyData.map((item) => (
                  <div key={item.name} className="text-center">
                    <p className="text-sm font-medium text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.name} tests</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="tests" 
                    name="Tests Taken"
                    fill={COLORS.blue}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgScore" 
                    name="Avg Score %"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    dot={{ fill: COLORS.green, strokeWidth: 2 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
