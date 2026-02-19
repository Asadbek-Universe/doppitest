import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, LayoutGrid, List, Star, Users, BookOpen, Clock, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import { useSubjects } from "@/hooks/useTests";
import { CoursePlayer } from "@/components/CoursePlayer";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { PreviewModeBanner } from "@/components/PreviewModeBanner";

import courseMath from "@/assets/course-math.jpg";
import coursePhysics from "@/assets/course-physics.jpg";
import courseChemistry from "@/assets/course-chemistry.jpg";

const courseImages: Record<string, string> = {
  "Chemistry Essentials": courseChemistry,
  "Physics Fundamentals": coursePhysics,
  "Advanced Mathematics": courseMath,
};

const Courses: FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const { isPreviewMode } = usePreviewMode();

  const { data: subjects } = useSubjects();
  const { data: courses, isLoading } = useCourses(
    selectedSubject === "all" ? undefined : selectedSubject
  );

  const filteredCourses = courses?.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (selectedCourse) {
    return (
      <CoursePlayer
        courseId={selectedCourse}
        onBack={() => setSelectedCourse(null)}
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
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-primary italic">
                Discover Courses
              </h1>
              {isPreviewMode && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg mb-8">
              Explore thousands of courses from top centers and universities. Find the perfect course to advance your skills.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses, subjects, or centers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-28 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-md"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90">
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="border-b border-border bg-background py-4">
        <div className="container px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filter by:</span>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-32 bg-card">
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

              <Select defaultValue="all">
                <SelectTrigger className="w-32 bg-card">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-32 bg-card">
                  <SelectValue placeholder="All Centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centers</SelectItem>
                  <SelectItem value="registon">Registon Academy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Select defaultValue="popular">
                <SelectTrigger className="w-32 bg-card">
                  <SelectValue placeholder="Popular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <section className="container px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">
            All Courses ({filteredCourses?.length || 0} results)
          </h2>
          <span className="text-sm text-muted-foreground">
            Showing 1-{filteredCourses?.length || 0}
          </span>
        </div>
      </section>

      {/* Courses Grid */}
      <main className="container px-6 pb-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredCourses?.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`bg-card border border-border overflow-hidden hover:shadow-md transition-shadow group cursor-pointer ${
                    viewMode === "list" ? "flex flex-row" : ""
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <div
                    className={`relative overflow-hidden ${
                      viewMode === "list" ? "w-64 flex-shrink-0" : "h-48"
                    }`}
                  >
                    <img
                      src={courseImages[course.title] || courseChemistry}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {course.is_free && (
                      <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-500">
                        Free
                      </Badge>
                    )}
                    {course.subjects && (
                      <Badge
                        className="absolute top-3 right-3"
                        style={{
                          backgroundColor: course.subjects.color || "hsl(var(--primary))",
                        }}
                      >
                        {course.subjects.name}
                      </Badge>
                    )}
                  </div>
                  <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <h3 className="font-bold text-foreground mb-2 text-lg">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{(course.students_count / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessons_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(course.duration_minutes)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by <span className="text-foreground font-medium">{course.instructor_name}</span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
