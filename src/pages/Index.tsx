import { FC } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, BookOpen, Trophy, Zap, Users, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { TestCard } from "@/components/TestCard";
import { CourseCard } from "@/components/CourseCard";
import { ReelCard } from "@/components/ReelCard";
import { CenterCard } from "@/components/CenterCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";

// Import images
import heroBg from "@/assets/hero-bg.jpg";
import courseMath from "@/assets/course-math.jpg";
import coursePhysics from "@/assets/course-physics.jpg";
import courseEnglish from "@/assets/course-english.jpg";
import courseChemistry from "@/assets/course-chemistry.jpg";
import reel1 from "@/assets/reel-1.jpg";
import reel2 from "@/assets/reel-2.jpg";
import reel3 from "@/assets/reel-3.jpg";
import centerCover from "@/assets/center-cover.jpg";
import doppiLogo from "@/assets/doppi-logo.png";

// Sample data
const featuredTests = [
  {
    id: "1",
    title: "University Entrance Exam 2024 - Mathematics",
    subject: "Mathematics",
    difficulty: 4,
    price: 0,
    questionsCount: 50,
    duration: 90,
    completions: 12453,
    author: "Registon Academy",
    authorVerified: true,
    isNew: true,
    imageUrl: courseMath,
  },
  {
    id: "2",
    title: "Physics Olympiad Preparation - Mechanics",
    subject: "Physics",
    difficulty: 5,
    price: 250,
    questionsCount: 30,
    duration: 60,
    completions: 5621,
    author: "Science Hub",
    authorVerified: true,
    imageUrl: coursePhysics,
  },
  {
    id: "3",
    title: "IELTS Reading Practice Test",
    subject: "English",
    difficulty: 3,
    price: 0,
    questionsCount: 40,
    duration: 60,
    completions: 28934,
    author: "English Masters",
    authorVerified: false,
    imageUrl: courseEnglish,
  },
  {
    id: "4",
    title: "Chemistry Final Exam Prep",
    subject: "Chemistry",
    difficulty: 3,
    price: 150,
    questionsCount: 45,
    duration: 75,
    completions: 7823,
    author: "ChemLab Pro",
    authorVerified: true,
    imageUrl: courseChemistry,
  },
];

const featuredCourses = [
  {
    id: "1",
    title: "Complete Mathematics Course for University",
    subject: "Mathematics",
    description: "Master algebra, calculus, and geometry with comprehensive video lessons and practice problems.",
    lessonsCount: 48,
    duration: "24 hours",
    author: "Registon Academy",
    authorVerified: true,
    rating: 4.9,
    studentsCount: 15234,
    progress: 65,
    imageUrl: courseMath,
    isFree: false,
  },
  {
    id: "2",
    title: "Physics from Zero to Hero",
    subject: "Physics",
    description: "Learn physics concepts through engaging experiments and real-world applications.",
    lessonsCount: 36,
    duration: "18 hours",
    author: "Science Hub",
    authorVerified: true,
    rating: 4.8,
    studentsCount: 9876,
    imageUrl: coursePhysics,
    isFree: true,
  },
  {
    id: "3",
    title: "English Speaking Mastery",
    subject: "English",
    description: "Improve your speaking skills with native speakers and real conversation practice.",
    lessonsCount: 24,
    duration: "12 hours",
    author: "English Masters",
    authorVerified: false,
    rating: 4.7,
    studentsCount: 21345,
    imageUrl: courseEnglish,
    isFree: false,
  },
];

const featuredReels = [
  {
    id: "1",
    title: "5 Math Tricks That Will Blow Your Mind",
    subject: "Math",
    thumbnailUrl: reel1,
    duration: "0:45",
    views: 45200,
    likes: 3420,
    author: "MathGenius",
  },
  {
    id: "2",
    title: "Amazing Chemical Reaction Experiment",
    subject: "Chemistry",
    thumbnailUrl: reel2,
    duration: "0:58",
    views: 128000,
    likes: 12500,
    author: "ScienceLab",
  },
  {
    id: "3",
    title: "Learn 10 English Phrases in 1 Minute",
    subject: "English",
    thumbnailUrl: reel3,
    duration: "1:00",
    views: 67800,
    likes: 5600,
    author: "WordMaster",
  },
];

const leaderboardUsers = [
  { rank: 1, previousRank: 2, name: "Aziza K.", xp: 45230, level: 28 },
  { rank: 2, previousRank: 1, name: "Sardor M.", xp: 42150, level: 26 },
  { rank: 3, previousRank: 3, name: "Dilnoza R.", xp: 39840, level: 25 },
  { rank: 4, previousRank: 5, name: "Jasur T.", xp: 38120, level: 24 },
  { rank: 5, previousRank: 4, name: "Nodira S.", xp: 36980, level: 23 },
];

// Subject chips removed (kept intentionally minimal)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index: FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-12 overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-hero">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                #1 Educational Platform in Uzbekistan
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Learn Smarter,{" "}
              <span className="text-gradient-primary">Achieve More</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 100,000+ students preparing for university exams, olympiads, and certifications. 
              Interactive tests, video courses, and AI-powered recommendations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { value: "100K+", label: "Students" },
                { value: "5,000+", label: "Tests" },
                { value: "500+", label: "Courses" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-gradient-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>



      {/* Main Content */}
      <main className="container px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            {/* Featured Tests */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Featured Tests
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Popular tests recommended for you
                  </p>
                </div>
                <Button variant="ghost" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredTests.map((test) => (
                  <motion.div key={test.id} variants={itemVariants}>
                    <TestCard {...test} />
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Short Videos / Reels */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Play className="w-6 h-6 text-accent" />
                    Quick Lessons
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn something new in under 60 seconds
                  </p>
                </div>
                <Button variant="ghost" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {featuredReels.map((reel) => (
                  <motion.div key={reel.id} variants={itemVariants}>
                    <ReelCard {...reel} />
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Featured Courses */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-coin" />
                    Top Courses
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive learning paths
                  </p>
                </div>
                <Button variant="ghost" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredCourses.map((course) => (
                  <motion.div key={course.id} variants={itemVariants}>
                    <CourseCard {...course} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
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

            {/* Featured Center */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Top Center
                </h3>
              </div>
              <CenterCard
                id="1"
                name="Registon Academy"
                description="Leading educational center specializing in university entrance preparation and olympiad training."
                location="Tashkent, Uzbekistan"
                subjects={["Mathematics", "Physics", "Chemistry", "Biology"]}
                rating={4.9}
                reviewsCount={2456}
                studentsCount={15000}
                isVerified={true}
                coverUrl={centerCover}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="p-5 rounded-xl bg-gradient-hero border border-primary/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-coin" />
                Daily Challenge
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete today's challenge to earn bonus XP and maintain your streak!
              </p>
              <Button variant="accent" className="w-full">
                Start Challenge
                <Zap className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Join CTA */}
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
              <Button variant="glass" className="w-full text-primary-foreground border-primary-foreground/20">
                Open Center Dashboard
                <ArrowRight className="w-4 h-4" />
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
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom padding */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default Index;
