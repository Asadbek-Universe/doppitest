import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Search, 
  BookOpen, 
  GraduationCap, 
  Play, 
  Building2, 
  Trophy,
  Sparkles,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LazySection } from "@/components/LazySection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { OlympiadCard } from "@/components/home/OlympiadCard";
import { FeaturedCenterCard } from "@/components/home/FeaturedCenterCard";
import { PersonalizedSection } from "@/components/home/PersonalizedSection";
import { RecommendedForYou } from "@/components/home/RecommendedForYou";
import { TestCard } from "@/components/TestCard";
import { CourseCard } from "@/components/CourseCard";
import { ReelCard } from "@/components/ReelCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Skeleton, 
  SkeletonTestCard, 
  SkeletonCourseCard, 
  SkeletonReelCard, 
  SkeletonCenterCard,
  SkeletonOlympiadCard 
} from "@/components/ui/skeleton";
import {
  useFeaturedTests,
  useFeaturedCourses,
  useFeaturedReels,
  useFeaturedCenters,
  useUpcomingOlympiads,
  useAllSubjects,
} from "@/hooks/useHomeFeed";
import { useProfile } from "@/hooks/useProfile";

// Fallback images for empty states
import courseMath from "@/assets/course-math.jpg";
import coursePhysics from "@/assets/course-physics.jpg";
import courseEnglish from "@/assets/course-english.jpg";
import courseChemistry from "@/assets/course-chemistry.jpg";
import reel1 from "@/assets/reel-1.jpg";
import reel2 from "@/assets/reel-2.jpg";
import reel3 from "@/assets/reel-3.jpg";
import doppiLogo from "@/assets/doppi-logo.png";

// Fallback data
const fallbackImages = [courseMath, coursePhysics, courseEnglish, courseChemistry];
const fallbackReelImages = [reel1, reel2, reel3];

const leaderboardUsers = [
  { rank: 1, previousRank: 2, name: "Aziza K.", xp: 45230, level: 28 },
  { rank: 2, previousRank: 1, name: "Sardor M.", xp: 42150, level: 26 },
  { rank: 3, previousRank: 3, name: "Dilnoza R.", xp: 39840, level: 25 },
  { rank: 4, previousRank: 5, name: "Jasur T.", xp: 38120, level: 24 },
  { rank: 5, previousRank: 4, name: "Nodira S.", xp: 36980, level: 23 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Feed: FC = () => {
  const { data: tests, isLoading: testsLoading } = useFeaturedTests();
  const { data: courses, isLoading: coursesLoading } = useFeaturedCourses();
  const { data: reels, isLoading: reelsLoading } = useFeaturedReels();
  const { data: centers, isLoading: centersLoading } = useFeaturedCenters();
  const { data: olympiads, isLoading: olympiadsLoading } = useUpcomingOlympiads();
  const { data: subjects } = useAllSubjects();
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-hero">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              #1 Educational Platform in Uzbekistan
            </span>
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-foreground">
  Discover, Learn, and{" "}
  <span className="text-gradient-primary">Excel</span>
</h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore tests, courses, reels, and olympiads from top educational centers
          </p>
        </motion.div>
      </div>
    </section>

      {/* Subjects Quick Filter */}
      {subjects && subjects.length > 0 && (
        <section className="py-4 border-y border-border bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {subjects.map((subject, index) => (
                <motion.button
                  key={subject.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all whitespace-nowrap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{subject.icon || "📚"}</span>
                  <span className="font-medium text-sm">{subject.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            {/* Personalized Welcome Section */}
            <PersonalizedSection avatarUrl={profile?.avatar_url} />
            
            {/* Personalized Recommendations */}
            <RecommendedForYou />

            {/* Upcoming Olympiads */}
            <LazySection
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <SkeletonOlympiadCard key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              {(olympiadsLoading || (olympiads && olympiads.length > 0)) && (
                <motion.section
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <SectionHeader
                    icon={<Trophy className="w-6 h-6 text-amber-500" />}
                    title="Upcoming Olympiads"
                    subtitle="Compete and win prizes"
                    viewAllLink="/tests"
                  />
                  
                  {olympiadsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {olympiads?.slice(0, 4).map((olympiad) => (
                        <motion.div key={olympiad.id} variants={itemVariants}>
                          <OlympiadCard
                            id={olympiad.id}
                            title={olympiad.title}
                            subject={olympiad.subjects}
                            center={olympiad.educational_centers}
                            startDate={olympiad.start_date}
                            endDate={olympiad.end_date}
                            maxParticipants={olympiad.max_participants || undefined}
                            currentParticipants={olympiad.current_participants || undefined}
                            prizeDescription={olympiad.prize_description || undefined}
                            status={olympiad.status}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.section>
              )}
            </LazySection>

            {/* Featured Tests */}
            <LazySection
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonTestCard key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <SectionHeader
                  icon={<BookOpen className="w-6 h-6 text-primary" />}
                  title="Featured Tests"
                  subtitle="Popular tests to challenge yourself"
                  viewAllLink="/tests"
                />

                {testsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonTestCard key={i} />
                    ))}
                  </div>
                ) : tests && tests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tests.slice(0, 4).map((test, index) => (
                      <motion.div key={test.id} variants={itemVariants}>
                        <TestCard
                          id={test.id}
                          title={test.title}
                          subject={test.subjects?.name || "General"}
                          difficulty={test.difficulty}
                          price={test.price || 0}
                          questionsCount={test.questions_count}
                          duration={test.duration_minutes}
                          completions={test.completions || 0}
                          author={test.educational_centers?.name || test.author_name || "Anonymous"}
                          authorVerified={test.educational_centers?.is_verified || false}
                          isNew={false}
                          imageUrl={fallbackImages[index % fallbackImages.length]}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tests available yet</p>
                    <Button variant="ghost" className="mt-2" asChild>
                      <Link to="/tests">Browse Tests</Link>
                    </Button>
                  </div>
                )}
              </motion.section>
            </LazySection>

            {/* Quick Reels */}
            <LazySection
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <SkeletonReelCard key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <SectionHeader
                  icon={<Play className="w-6 h-6 text-pink-500" />}
                  title="Quick Lessons"
                  subtitle="Learn in under 60 seconds"
                  viewAllLink="/reels"
                />

                {reelsLoading ? (
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <SkeletonReelCard key={i} />
                    ))}
                  </div>
                ) : reels && reels.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {reels.slice(0, 3).map((reel, index) => (
                      <motion.div key={reel.id} variants={itemVariants}>
                        <ReelCard
                          id={reel.id}
                          title={reel.title}
                          subject={reel.subjects?.name || "General"}
                          thumbnailUrl={reel.thumbnail_url || fallbackReelImages[index % fallbackReelImages.length]}
                          duration={reel.duration_seconds ? `${Math.floor(reel.duration_seconds / 60)}:${String(reel.duration_seconds % 60).padStart(2, '0')}` : "1:00"}
                          views={reel.views_count}
                          likes={reel.likes_count}
                          author={reel.educational_centers?.name || "Creator"}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {fallbackReelImages.map((img, index) => (
                      <motion.div key={index} variants={itemVariants}>
                        <ReelCard
                          id={String(index)}
                          title="Coming Soon"
                          subject="Education"
                          thumbnailUrl={img}
                          duration="1:00"
                          views={0}
                          likes={0}
                          author="Doppi"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </LazySection>

            {/* Featured Courses */}
            <LazySection
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <SkeletonCourseCard key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <SectionHeader
                  icon={<GraduationCap className="w-6 h-6 text-emerald-500" />}
                  title="Top Courses"
                  subtitle="Comprehensive learning paths"
                  viewAllLink="/courses"
                />

                {coursesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <SkeletonCourseCard key={i} />
                    ))}
                  </div>
                ) : courses && courses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.slice(0, 6).map((course, index) => (
                      <motion.div key={course.id} variants={itemVariants}>
                        <CourseCard
                          id={course.id}
                          title={course.title}
                          subject={course.subjects?.name || "General"}
                          description={course.description || "Learn something new"}
                          lessonsCount={course.lessons_count || 0}
                          duration={`${Math.round((course.duration_minutes || 0) / 60)} hours`}
                          author={course.educational_centers?.name || course.instructor_name}
                          authorVerified={course.educational_centers?.is_verified || false}
                          rating={course.rating || 4.5}
                          studentsCount={course.students_count || 0}
                          imageUrl={course.thumbnail_url || fallbackImages[index % fallbackImages.length]}
                          isFree={course.is_free || false}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No courses available yet</p>
                    <Button variant="ghost" className="mt-2" asChild>
                      <Link to="/courses">Browse Courses</Link>
                    </Button>
                  </div>
                )}
              </motion.section>
            </LazySection>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LeaderboardCard title="Weekly Leaders" users={leaderboardUsers} />
            </motion.div>

            {/* Featured Centers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  Top Centers
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/centers">
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>

              {centersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCenterCard key={i} />
                  ))}
                </div>
              ) : centers && centers.length > 0 ? (
                <div className="space-y-3">
                  {centers.slice(0, 5).map((center) => (
                    <FeaturedCenterCard
                      key={center.id}
                      id={center.id}
                      name={center.name}
                      description={center.description || undefined}
                      city={center.city || undefined}
                      followersCount={center.followers_count}
                      isVerified={center.is_verified || false}
                      logoUrl={center.logo_url || undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No verified centers yet</p>
                </div>
              )}
            </motion.div>

            {/* Daily Challenge CTA */}
            <motion.div
              className="p-5 rounded-xl bg-gradient-hero border border-primary/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Challenge
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete today's challenge to earn bonus XP and maintain your streak!
              </p>
              <Button variant="accent" className="w-full" asChild>
                <Link to="/games">
                  Start Challenge
                  <Sparkles className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </motion.div>

            {/* Educator CTA */}
            <motion.div
              className="p-5 rounded-xl bg-gradient-primary text-primary-foreground"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="font-bold mb-2">Are you an educator?</h3>
              <p className="text-sm opacity-90 mb-4">
                Create courses, tests, and reach thousands of students.
              </p>
              <Button variant="glass" className="w-full text-primary-foreground border-primary-foreground/20" asChild>
                <Link to="/center-panel">
                  Open Center Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </motion.div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={doppiLogo} alt="Doppi" className="h-8 w-8 rounded-full object-contain" />
              <span className="font-bold text-lg text-primary">Doppi</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 Doppi. Made with ❤️ in Uzbekistan.
            </p>
            <div className="flex items-center gap-4">
              <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Feed;
