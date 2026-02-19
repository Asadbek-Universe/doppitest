import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, CheckCircle, XCircle, Clock, Target, TrendingUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface TestResults {
  score: number;
  totalPoints: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpent: number;
  weakTopics: string[];
}

interface PostTestAnalyticsProps {
  testTitle: string;
  results: TestResults;
  onRetry: () => void;
}

const COLORS = {
  correct: "#22c55e",
  wrong: "#ef4444",
  skipped: "#eab308",
};

export const PostTestAnalytics: FC<PostTestAnalyticsProps> = ({
  testTitle,
  results,
  onRetry,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const pieData = [
    { name: "Correct", value: results.correct, color: COLORS.correct },
    { name: "Wrong", value: results.wrong, color: COLORS.wrong },
    { name: "Skipped", value: results.skipped, color: COLORS.skipped },
  ].filter((d) => d.value > 0);

  const totalQuestions = results.correct + results.wrong + results.skipped;

  // Topic performance data (mock - in real scenario would come from actual answers)
  const topicData = results.weakTopics.length > 0
    ? results.weakTopics.map((topic, idx) => ({
        name: topic.length > 12 ? topic.substring(0, 12) + "..." : topic,
        fullName: topic,
        score: Math.floor(Math.random() * 40) + 10, // Would be real data
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Hero Score Section */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div
          className={`w-28 h-28 rounded-full mx-auto mb-6 flex items-center justify-center ${
            results.percentage >= 70
              ? "bg-green-500/20"
              : results.percentage >= 50
              ? "bg-orange-500/20"
              : "bg-red-500/20"
          }`}
        >
          <Trophy
            className={`w-14 h-14 ${
              results.percentage >= 70
                ? "text-green-500"
                : results.percentage >= 50
                ? "text-orange-500"
                : "text-red-500"
            }`}
          />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {results.percentage >= 70
            ? "Excellent Work!"
            : results.percentage >= 50
            ? "Good Effort!"
            : "Keep Practicing!"}
        </h2>
        <p className="text-muted-foreground">{testTitle}</p>
      </motion.div>

      {/* Score Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your Score</p>
          <p className="text-6xl font-bold text-primary mb-2">{results.percentage}%</p>
          <p className="text-muted-foreground">
            {results.score}/{results.totalPoints} points
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{results.correct}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{results.wrong}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="pt-4 text-center">
            <Target className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{results.skipped}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatTime(results.timeSpent)}</p>
            <p className="text-xs text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Answer Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Answer Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [
                      `${value} (${Math.round((value / totalQuestions) * 100)}%)`,
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weak Topics */}
        {topicData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value}%`,
                        props.payload.fullName,
                      ]}
                    />
                    <Bar dataKey="score" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Retry Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Retry Test
        </Button>
      </div>
    </div>
  );
};
