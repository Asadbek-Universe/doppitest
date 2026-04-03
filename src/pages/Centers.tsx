import { FC, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Star, Users, MapPin, BookOpen, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicCenters } from "@/hooks/usePublicCenter";

import centerCover from "@/assets/center-cover.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const tabs = ["All", "Centers", "Universities", "Teachers"];

const Centers: FC = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: centers, isLoading } = usePublicCenters();

  const filteredCenters = centers?.filter((center) =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section with background picture */}
      <section className="relative pt-20 md:pt-24 pb-12 min-h-[420px] md:min-h-[480px] flex flex-col justify-center overflow-hidden">
        {/* Background image layer */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        {/* Overlay for readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_30%,hsl(var(--primary)/0.25),transparent_60%)]" />

        <div className="container relative z-10 px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md mb-4">
              Discover Educational Centers & Teachers
            </h1>
            <p className="text-white/90 text-lg mb-8 drop-shadow-sm">
              Find the best educational institutions, universities, and expert teachers to support your learning journey
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
              <input
                type="text"
                placeholder="Search centers, universities, or teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white/95 border border-white/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-lg"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground">
                Search
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full ${activeTab !== tab ? "border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white" : ""}`}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container px-6 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-primary font-semibold">
              {filteredCenters?.length ?? 0} results found
            </span>

            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-28 bg-card">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Subject</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-28 bg-card">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Location</SelectItem>
                  <SelectItem value="tashkent">Tashkent</SelectItem>
                  <SelectItem value="samarkand">Samarkand</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-24 bg-card">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Rating</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select defaultValue="relevant">
              <SelectTrigger className="w-36 bg-card">
                <SelectValue placeholder="Most Relevant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">Most Relevant</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>

            <button className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Centers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCenters && filteredCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCenters.map((center, index) => (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/centers/${center.id}`}>
                  <Card className="bg-card border border-border overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={centerCover}
                        alt={center.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                    
                    {/* Logo */}
                    <div className="relative px-4 -mt-8">
                      <div className="w-16 h-16 rounded-xl bg-card border-4 border-card shadow-md overflow-hidden">
                        {center.logo_url ? (
                          <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-foreground">
                              {center.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <CardContent className="pt-2 pb-4">
                      <div className="flex items-start gap-2 mb-1">
                        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {center.name}
                        </h3>
                        {center.is_verified && (
                          <Badge className="bg-green-500/10 text-green-600 gap-1 shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {center.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{center.city}</span>
                        </div>
                      )}
                      
                      {center.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {center.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-foreground">4.8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Courses</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          View Center →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Centers Found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Centers;
