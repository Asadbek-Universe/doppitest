import { FC, useState } from "react";
import { motion } from "framer-motion";
import { FileText, BookOpen, Gamepad2, Trophy, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const quickNavItems = [
  { icon: FileText, label: "All Tests", path: "/tests" },
  { icon: BookOpen, label: "All Courses", path: "/courses" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Trophy, label: "Olympiads", path: "/olympiads" },
];

const subjects = [
  { name: "Mathematics", selected: true },
  { name: "Physics", selected: true },
  { name: "Chemistry", selected: true },
];

const difficulties = [
  { name: "Easy", checked: false },
  { name: "Medium", checked: false },
  { name: "Hard", checked: false },
];

export const LeftSidebar: FC = () => {
  const [selectedSubjects, setSelectedSubjects] = useState(subjects);

  return (
    <aside className="space-y-6">
      {/* Quick Navigation */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {quickNavItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              whileHover={{ x: 4 }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.a>
          ))}
        </CardContent>
      </Card>

      {/* My Subjects */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">My Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedSubjects.map((subject) => (
            <div
              key={subject.name}
              className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium"
            >
              {subject.name}
            </div>
          ))}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Subject</span>
          </button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Difficulty</h4>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <div key={difficulty.name} className="flex items-center gap-3">
                    <Checkbox id={difficulty.name} />
                    <label
                      htmlFor={difficulty.name}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      {difficulty.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};
