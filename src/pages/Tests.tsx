import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Clock, TrendingUp, ChevronRight, Loader2, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveBookmarkButton } from "@/components/SaveBookmarkButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TestPlayer from "@/components/TestPlayer";
import { useTests, useSubjects, Test } from "@/hooks/useTests";
import { useAuth } from "@/hooks/useAuth";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { PreviewModeBanner } from "@/components/PreviewModeBanner";
import { useToast } from "@/hooks/use-toast";

const tabs = ["All Tests", "Official Tests", "Center Tests", "Free Tests"];

const stats = [
  { value: "5+", label: "Tests", color: "bg-primary" },
  { value: "5+", label: "Subjects", color: "bg-accent" },
  { value: "AI", label: "Powered", color: "bg-xp" },
];

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 2) return "Easy";
  if (difficulty <= 4) return "Medium";
  return "Hard";
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 2) return "text-green-500";
  if (difficulty <= 4) return "text-orange-500";
  return "text-red-500";
};

const getAuthorInitial = (name: string | null) => {
  return name ? name.charAt(0).toUpperCase() : "T";
};

const Tests: FC = () => {
  const { user } = useAuth();
  const { isPreviewMode, canInteract } = usePreviewMode();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("All Tests");
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const { data: tests, isLoading: testsLoading } = useTests();
  const { data: subjects } = useSubjects();

  // Filter tests based on tab and filters
  const filteredTests = tests?.filter((test) => {
    // Tab filter
    if (activeTab === "Official Tests" && !test.is_official) return false;
    if (activeTab === "Center Tests" && test.is_official) return false;
    if (activeTab === "Free Tests" && !test.is_free) return false;

    // Subject filter
    if (selectedSubject !== "all" && test.subject_id !== selectedSubject) return false;

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      const diffLabel = getDifficultyLabel(test.difficulty);
      if (diffLabel.toLowerCase() !== selectedDifficulty) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        test.title.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        test.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleStartTest = (test: Test) => {
    if (!canInteract) {
      toast({
        title: "Preview Mode",
        description: "You cannot start tests in preview mode. This feature is for students only.",
        variant: "destructive",
      });
      return;
    }
    setActiveTest(test);
  };

  if (activeTest && canInteract) {
    return (
      <TestPlayer 
        test={{
          id: activeTest.id,
          title: activeTest.title,
          tag: activeTest.is_official ? "Official" : "Center Test",
          difficulty: getDifficultyLabel(activeTest.difficulty),
          questionsCount: activeTest.questions_count,
          duration: activeTest.duration_minutes,
        }} 
        onExit={() => setActiveTest(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-12 bg-gradient-hero">
        <div className="container px-6">
          {/* Preview Mode Banner */}
          {isPreviewMode && (
            <div className="max-w-3xl mx-auto mb-6">
              <PreviewModeBanner />
            </div>
          )}
          
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Explore Tests & Assessments
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Challenge yourself with official tests, practice assessments, and AI-powered recommendations tailored to your goals.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, subject, or topic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-28 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-md"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90">
                Search
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-2`}>
                    <span className="text-lg font-bold text-white">{stat.value}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs and Filters */}
      <section className="border-b border-border bg-background py-4">
        <div className="container px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                  className="rounded-full"
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40 bg-card">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32 bg-card">
                  <SelectValue placeholder="All Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Tests Grid */}
      <main className="container px-6 py-10">
        {testsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTests && filteredTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card border border-border hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Header with tag and bookmark */}
                    <div className="flex items-start justify-between mb-4">
                      <Badge className={test.is_official ? "bg-primary text-primary-foreground" : "bg-teal-500 text-white"}>
                        {test.is_official ? "Official" : "Center Test"}
                      </Badge>
                      <SaveBookmarkButton itemId={test.id} itemType="test" />
                    </div>

                    {/* Title and description */}
                    <h3 className="text-xl font-bold text-foreground mb-2">{test.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                      {test.description || "No description available"}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-between mb-6 py-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{test.questions_count} Questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{test.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getDifficultyColor(test.difficulty)}`} />
                        <span className={`text-sm font-medium ${getDifficultyColor(test.difficulty)}`}>
                          {getDifficultyLabel(test.difficulty)}
                        </span>
                      </div>
                    </div>

                    {/* Author and Start button */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {test.author_avatar && <AvatarImage src={test.author_avatar} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getAuthorInitial(test.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{test.author_name || "Unknown"}</span>
                      </div>
                      <Button 
                        className={`group ${!canInteract ? 'opacity-60' : 'bg-primary hover:bg-primary/90'}`}
                        onClick={() => handleStartTest(test)}
                        disabled={!canInteract}
                      >
                        {!canInteract ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview Only
                          </>
                        ) : (
                          <>
                            Start Test
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tests found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search or filters" : "No tests available at the moment"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tests;
