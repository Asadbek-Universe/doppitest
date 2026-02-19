import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Play, Loader2, Eye } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReelsPlayer } from "@/components/ReelsPlayer";
import { usePublishedReels, useSubjects } from "@/hooks/useReels";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { PreviewModeBanner } from "@/components/PreviewModeBanner";

import reel1 from "@/assets/reel-1.jpg";
import reel2 from "@/assets/reel-2.jpg";
import reel3 from "@/assets/reel-3.jpg";

// Fallback demo data when no database reels exist
const demoReels = [
  {
    id: "demo-1",
    title: "Physics in Daily Life: Why Sky is Blue",
    description: "Learn the fascinating science behind the blue sky phenomenon through Rayleigh scattering.",
    video_url: "",
    thumbnail_url: reel1,
    duration_seconds: 60,
    views_count: 15420,
    likes_count: 892,
    is_published: true,
    created_at: new Date().toISOString(),
    center_id: "demo",
    subject_id: null,
    subject: { id: "1", name: "Physics", color: "#3b82f6" },
    center: { id: "demo", name: "Science Academy", logo_url: null },
  },
  {
    id: "demo-2",
    title: "Python in 60 Seconds: List Comprehension",
    description: "Master Python list comprehensions with this quick tutorial for beginners.",
    video_url: "",
    thumbnail_url: reel2,
    duration_seconds: 60,
    views_count: 23100,
    likes_count: 1456,
    is_published: true,
    created_at: new Date().toISOString(),
    center_id: "demo",
    subject_id: null,
    subject: { id: "2", name: "Programming", color: "#10b981" },
    center: { id: "demo", name: "Code Masters", logo_url: null },
  },
  {
    id: "demo-3",
    title: "Chemistry Magic: Color-Changing Reactions",
    description: "Watch amazing chemical reactions that change colors before your eyes!",
    video_url: "",
    thumbnail_url: reel3,
    duration_seconds: 45,
    views_count: 8934,
    likes_count: 567,
    is_published: true,
    created_at: new Date().toISOString(),
    center_id: "demo",
    subject_id: null,
    subject: { id: "3", name: "Chemistry", color: "#f59e0b" },
    center: { id: "demo", name: "Lab Explorers", logo_url: null },
  },
];

const Reels: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);
  const { isPreviewMode } = usePreviewMode();

  const { data: reels, isLoading: reelsLoading } = usePublishedReels(selectedCategory);
  const { data: subjects } = useSubjects();

  // Use database reels if available, otherwise use demo data
  const displayReels = reels && reels.length > 0 ? reels : demoReels;

  // Filter reels by search query
  const filteredReels = displayReels.filter(reel =>
    reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: "all", name: "All" },
    ...(subjects?.map(s => ({ id: s.id, name: s.name })) || []),
  ];

  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <section className="pt-20 md:pt-24 pb-4">
          <div className="container px-6">
            <PreviewModeBanner />
          </div>
        </section>
      )}

      {/* Top Bar with Categories */}
      <section className={`${isPreviewMode ? 'pt-4' : 'pt-20 md:pt-24'} pb-4 bg-card border-b border-border`}>
        <div className="container px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search reels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 md:w-64 h-10 pl-10 pr-4 rounded-xl bg-muted border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container px-6 py-8">
        {reelsLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Reels Player */}
            <div className="lg:col-span-8">
              <div className="aspect-[9/16] max-h-[700px] mx-auto lg:mx-0">
                <ReelsPlayer 
                  reels={filteredReels} 
                  initialIndex={selectedReelIndex}
                />
              </div>
            </div>

            {/* For You Sidebar */}
            <div className="lg:col-span-4">
              <Card className="bg-card border border-border sticky top-24">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">For You</h3>
                    <span className="text-sm text-muted-foreground">
                      {filteredReels.length} reels
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredReels.map((reel, index) => (
                      <motion.div
                        key={reel.id}
                        className={`flex gap-3 cursor-pointer group p-2 rounded-lg transition-colors ${
                          index === selectedReelIndex 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted"
                        }`}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedReelIndex(index)}
                      >
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={reel.thumbnail_url || reel1}
                            alt={reel.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center group-hover:bg-foreground/50 transition-colors">
                            <Play className="w-6 h-6 text-background fill-background" />
                          </div>
                          {reel.subject && (
                            <div className="absolute top-1 left-1">
                              <span 
                                className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: reel.subject.color || "#6366f1" }}
                              >
                                {reel.subject.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {reel.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {reel.center?.name || "Creator"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{formatCount(reel.views_count)} views</span>
                            <span>{formatCount(reel.likes_count)} likes</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredReels.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No reels found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reels;
