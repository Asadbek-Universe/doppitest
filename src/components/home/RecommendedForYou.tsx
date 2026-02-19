import { FC } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { TestCard } from "@/components/TestCard";
import { OlympiadCard } from "@/components/home/OlympiadCard";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ContinueLearning } from "@/components/home/ContinueLearning";
import { RecentlyCompleted } from "@/components/home/RecentlyCompleted";
import { Skeleton, SkeletonTestCard, SkeletonOlympiadCard } from "@/components/ui/skeleton";
import { 
  usePersonalizedTests, 
  useRecommendedOlympiads,
  usePersonalizedGreeting 
} from "@/hooks/usePersonalizedFeed";
import { useAuth } from "@/hooks/useAuth";

// Fallback images
import courseMath from "@/assets/course-math.jpg";
import coursePhysics from "@/assets/course-physics.jpg";
import courseEnglish from "@/assets/course-english.jpg";
import courseChemistry from "@/assets/course-chemistry.jpg";

const fallbackImages = [courseMath, coursePhysics, courseEnglish, courseChemistry];

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

export const RecommendedForYou: FC = () => {
  const { user } = useAuth();
  const { hasProfile, grade, purpose } = usePersonalizedGreeting();
  const { data: tests, isLoading: testsLoading } = usePersonalizedTests(null);
  const { data: olympiads, isLoading: olympiadsLoading } = useRecommendedOlympiads();

  if (!user || !hasProfile) return null;

  const showOlympiads = purpose === "Olimpiadaga tayyorlanish" && olympiads && olympiads.length > 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Continue Learning Section */}
      <ContinueLearning />

      {/* Recently Completed */}
      <RecentlyCompleted />

      {/* Recommended Tests for Grade */}
      {(testsLoading || (tests && tests.length > 0)) && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key="all"
        >
          <SectionHeader
            icon={<Sparkles className="w-6 h-6 text-primary" />}
            title={grade ? `${grade} uchun testlar` : "Siz uchun tavsiya etilgan"}
            subtitle="Darajangizga mos testlar"
            viewAllLink="/tests"
          />

          {testsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonTestCard key={i} />
              ))}
            </div>
          ) : tests && tests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests?.slice(0, 6).map((test, index) => (
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
              Testlar topilmadi
            </div>
          )}
        </motion.section>
      )}

      {/* Olympiads for Competition Prep */}
      {showOlympiads && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SectionHeader
            icon={<Trophy className="w-6 h-6 text-amber-500" />}
            title="Olimpiadalar sizni kutmoqda!"
            subtitle="Tayyorgarlik davom etmoqda - ishtirok eting"
            viewAllLink="/olympiads"
          />

          {olympiadsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <SkeletonOlympiadCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {olympiads?.slice(0, 2).map((olympiad) => (
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
    </div>
  );
};

