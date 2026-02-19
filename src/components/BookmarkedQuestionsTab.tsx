import { FC, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkX,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Download,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAllBookmarkedQuestions, BookmarkedQuestion } from "@/hooks/useAllBookmarkedQuestions";
import { useToggleQuestionBookmark } from "@/hooks/useQuestionBookmarks";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 2) return "Easy";
  if (difficulty <= 4) return "Medium";
  return "Hard";
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 2) return "text-green-500 bg-green-500/10";
  if (difficulty <= 4) return "text-orange-500 bg-orange-500/10";
  return "text-red-500 bg-red-500/10";
};

export const BookmarkedQuestionsTab: FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bookmarks, isLoading } = useAllBookmarkedQuestions(user?.id);
  const toggleBookmark = useToggleQuestionBookmark();

  const [searchQuery, setSearchQuery] = useState("");
  const [testFilter, setTestFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Get unique tests for filtering
  const uniqueTests = useMemo(() => {
    if (!bookmarks) return [];
    const testsMap = new Map<string, string>();
    bookmarks.forEach((b) => {
      if (b.test) {
        testsMap.set(b.test.id, b.test.title);
      }
    });
    return Array.from(testsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [bookmarks]);

  // Filter bookmarks
  const filtered = useMemo(() => {
    if (!bookmarks) return [];
    const q = searchQuery.toLowerCase().trim();
    return bookmarks.filter((b) => {
      if (testFilter !== "all" && b.test_id !== testFilter) return false;
      if (!q) return true;
      const text = `${b.question?.question_text || ""} ${b.question?.topic || ""} ${b.test?.title || ""}`;
      return text.toLowerCase().includes(q);
    });
  }, [bookmarks, searchQuery, testFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveBookmark = async (bookmark: typeof filtered[0]) => {
    if (!user) return;
    try {
      await toggleBookmark.mutateAsync({
        questionId: bookmark.question_id,
        testId: bookmark.test_id,
        userId: user.id,
      });
      queryClient.invalidateQueries({ queryKey: ["all-bookmarked-questions", user.id] });
      toast({
        title: "Bookmark removed",
        description: "Question removed from bookmarks.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove bookmark.",
        variant: "destructive",
      });
    }
  };

  const exportToPdf = () => {
    if (!filtered || filtered.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Bookmarked Questions Study Guide", margin, yPosition);
    yPosition += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Questions: ${filtered.length}`, margin, yPosition);
    yPosition += 15;

    filtered.forEach((bookmark, index) => {
      // Check if we need a new page
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // Question number and text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const questionHeader = `Question ${index + 1}`;
      doc.text(questionHeader, margin, yPosition);
      yPosition += 7;

      // Test name and topic
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      const testInfo = bookmark.test?.title ? `Test: ${bookmark.test.title}` : "";
      const topicInfo = bookmark.question?.topic ? ` | Topic: ${bookmark.question.topic}` : "";
      if (testInfo || topicInfo) {
        doc.text(testInfo + topicInfo, margin, yPosition);
        yPosition += 6;
      }

      // Question text
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const questionText = bookmark.question?.question_text || "Question not available";
      const splitQuestion = doc.splitTextToSize(questionText, contentWidth);
      doc.text(splitQuestion, margin, yPosition);
      yPosition += splitQuestion.length * 5 + 5;

      // Options
      if (bookmark.question?.question_options) {
        bookmark.question.question_options.forEach((option) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const prefix = option.is_correct ? "✓ " : "  ";
          doc.setFont("helvetica", option.is_correct ? "bold" : "normal");
          const optionText = `${prefix}${option.option_letter}. ${option.option_text}`;
          const splitOption = doc.splitTextToSize(optionText, contentWidth - 10);
          doc.text(splitOption, margin + 5, yPosition);
          yPosition += splitOption.length * 5 + 2;
        });
      }

      // Explanation
      if (bookmark.question?.explanation) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        yPosition += 3;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Explanation:", margin, yPosition);
        yPosition += 5;
        doc.setFont("helvetica", "normal");
        const splitExplanation = doc.splitTextToSize(bookmark.question.explanation, contentWidth);
        doc.text(splitExplanation, margin, yPosition);
        yPosition += splitExplanation.length * 4 + 5;
      }

      // Separator
      yPosition += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    });

    doc.save("bookmarked-questions-study-guide.pdf");
    toast({
      title: "PDF exported",
      description: `${filtered.length} questions exported successfully.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Bookmark className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No bookmarked questions
          </h3>
          <p className="text-muted-foreground mb-4">
            Bookmark questions while taking tests to review them later
          </p>
          <Link to="/tests">
            <Button>Browse Tests</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarked questions..."
            className="pl-9"
          />
        </div>
        <Select value={testFilter} onValueChange={setTestFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {uniqueTests.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={exportToPdf}
          disabled={filtered.length === 0}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} bookmarked question{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Bookmarked Questions List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <BookmarkX className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No questions match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((bookmark, index) => {
            const isExpanded = expandedIds.has(bookmark.id);
            const correctOption = bookmark.question?.question_options?.find(
              (o) => o.is_correct
            );

            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(bookmark.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-2">
                            {bookmark.question?.question_text || "Question not found"}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {bookmark.test && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {bookmark.test.title}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getDifficultyColor(bookmark.test.difficulty)}`}
                                >
                                  {getDifficultyLabel(bookmark.test.difficulty)}
                                </Badge>
                              </>
                            )}
                            {bookmark.question?.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {bookmark.question.topic}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBookmark(bookmark);
                            }}
                            disabled={toggleBookmark.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && bookmark.question && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 bg-muted/20 space-y-3">
                          {/* Options */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Options:
                            </p>
                            {bookmark.question.question_options.map((option) => (
                              <div
                                key={option.id}
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                  option.is_correct
                                    ? "bg-green-500/10 border border-green-500/30"
                                    : "bg-muted/30"
                                }`}
                              >
                                <span
                                  className={`font-medium ${
                                    option.is_correct ? "text-green-500" : "text-foreground"
                                  }`}
                                >
                                  {option.option_letter}.
                                </span>
                                <span
                                  className={
                                    option.is_correct ? "text-green-500" : "text-foreground"
                                  }
                                >
                                  {option.option_text}
                                </span>
                                {option.is_correct && (
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          {bookmark.question.explanation && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm">
                                <span className="font-medium text-primary">
                                  Explanation:{" "}
                                </span>
                                <span className="text-foreground">
                                  {bookmark.question.explanation}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Link to test */}
                          {bookmark.test && (
                            <div className="pt-2">
                              <Link to={`/tests?testId=${bookmark.test.id}`}>
                                <Button variant="outline" size="sm">
                                  Go to Test
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
