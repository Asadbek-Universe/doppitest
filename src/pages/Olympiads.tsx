import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Search, Filter, Calendar, History } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OlympiadCard } from "@/components/home/OlympiadCard";
import { PastOlympiadCard } from "@/components/home/PastOlympiadCard";
import { OlympiadStatsPanel } from "@/components/olympiad/OlympiadStatsPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpcomingOlympiads, usePastOlympiads, useAllSubjects } from "@/hooks/useHomeFeed";

const Olympiads: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("upcoming");
  const { data: olympiads, isLoading } = useUpcomingOlympiads();
  const { data: pastOlympiads, isLoading: pastLoading } = usePastOlympiads();
  const { data: subjects } = useAllSubjects();

  const filteredOlympiads = olympiads?.filter((olympiad) => {
    const matchesSearch = olympiad.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "all" || olympiad.subject_id === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const filteredPastOlympiads = pastOlympiads?.filter((olympiad) => {
    const matchesSearch = olympiad.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "all" || olympiad.subject_id === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--amber-500)/0.15),transparent_50%)]" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Compete & Win Prizes
              </span>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              Academic{" "}
              <span className="text-amber-500">Olympiads</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-xl">
              Challenge yourself in subject olympiads, compete with top students, and win prizes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 border-b border-border">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search olympiads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.icon} {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Main Content - Split View */}
      <main className="container px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Olympiad Cards */}
          <div className="flex-1 lg:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Past Results
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Olympiads */}
              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-72 rounded-xl" />
                    ))}
                  </div>
                ) : filteredOlympiads && filteredOlympiads.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {filteredOlympiads.map((olympiad, index) => (
                      <motion.div
                        key={olympiad.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
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
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                      <Trophy className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Upcoming Olympiads</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchQuery || subjectFilter !== "all"
                        ? "Try adjusting your filters to find more olympiads."
                        : "There are no upcoming olympiads at the moment. Check back later!"}
                    </p>
                    {(searchQuery || subjectFilter !== "all") && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSubjectFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Past Olympiads */}
              <TabsContent value="past">
                {pastLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                  </div>
                ) : filteredPastOlympiads && filteredPastOlympiads.length > 0 ? (
                  <>
                    {/* Winner Highlights Banner */}
                    <motion.div
                      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-bold">Past Champions</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Explore completed olympiads and see top performers
                      </p>
                    </motion.div>

                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {filteredPastOlympiads.map((olympiad, index) => (
                        <motion.div
                          key={olympiad.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <PastOlympiadCard
                            id={olympiad.id}
                            title={olympiad.title}
                            subject={olympiad.subjects}
                            center={olympiad.educational_centers}
                            endDate={olympiad.end_date}
                            currentParticipants={olympiad.current_participants}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <History className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Past Olympiads</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchQuery || subjectFilter !== "all"
                        ? "Try adjusting your filters to find past olympiads."
                        : "There are no completed olympiads yet. Stay tuned for results!"}
                    </p>
                    {(searchQuery || subjectFilter !== "all") && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSubjectFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Stats Panel (Desktop only) */}
          <aside className="hidden lg:block lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-24">
              <OlympiadStatsPanel />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Olympiads;
