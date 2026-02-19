import { FC, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  BookmarkPlus, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserCheck,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reel, useIncrementReelViews, useLikeReel } from "@/hooks/useReels";
import { useIsFollowing, useFollowCenter, useUnfollowCenter } from "@/hooks/useCenterFollow";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ReelsPlayerProps {
  reels: Reel[];
  initialIndex?: number;
}

export const ReelsPlayer: FC<ReelsPlayerProps> = ({ reels, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedReels = useRef<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();
  const incrementViews = useIncrementReelViews();
  const likeReel = useLikeReel();

  const currentReel = reels[currentIndex];
  const centerId = currentReel?.center_id;

  // Follow hooks
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(centerId);
  const followMutation = useFollowCenter();
  const unfollowMutation = useUnfollowCenter();

  const handleFollow = () => {
    if (!centerId) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate(centerId);
    } else {
      followMutation.mutate(centerId);
    }
  };

  const isFollowLoading = checkingFollow || followMutation.isPending || unfollowMutation.isPending;

  // Track view when reel changes
  useEffect(() => {
    if (currentReel && !viewedReels.current.has(currentReel.id)) {
      viewedReels.current.add(currentReel.id);
      incrementViews.mutate(currentReel.id);
    }
  }, [currentReel?.id]);

  // Video playback control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, currentIndex]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    }
  }, [currentIndex, reels.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold) {
      goToNext();
    } else if (info.offset.y > threshold) {
      goToPrevious();
    }
  };

  const handleLike = () => {
    if (!currentReel) return;
    
    if (likedReels.has(currentReel.id)) {
      setLikedReels(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentReel.id);
        return newSet;
      });
    } else {
      setLikedReels(prev => new Set(prev).add(currentReel.id));
      likeReel.mutate(currentReel.id);
    }
  };

  const handleSave = () => {
    if (!currentReel) return;
    
    if (savedReels.has(currentReel.id)) {
      setSavedReels(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentReel.id);
        return newSet;
      });
      toast.info("Removed from saved");
    } else {
      setSavedReels(prev => new Set(prev).add(currentReel.id));
      toast.success("Saved to collection");
    }
  };

  const handleShare = async () => {
    if (!currentReel) return;
    
    try {
      await navigator.share({
        title: currentReel.title,
        text: currentReel.description || "Check out this educational reel!",
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          goToPrevious();
          break;
        case "ArrowDown":
          goToNext();
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case "m":
          setIsMuted(prev => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (!currentReel) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-2xl">
        <p className="text-muted-foreground">No reels available</p>
      </div>
    );
  }

  const isLiked = likedReels.has(currentReel.id);
  const isSaved = savedReels.has(currentReel.id);

  return (
    <div 
      ref={containerRef}
      className="relative h-full bg-foreground rounded-2xl overflow-hidden select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentReel.id}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {/* Video */}
          {currentReel.video_url ? (
            <video
              ref={videoRef}
              src={currentReel.video_url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              autoPlay
              poster={currentReel.thumbnail_url || undefined}
              onClick={() => setIsPlaying(prev => !prev)}
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
              style={{
                backgroundImage: currentReel.thumbnail_url ? `url(${currentReel.thumbnail_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <Play className="w-16 h-16 text-background/50" />
            </div>
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/30 pointer-events-none" />

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-background/20">
            <motion.div 
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Play/Pause Indicator */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <div className="w-20 h-20 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-background ml-1" fill="currentColor" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {currentReel.subject && (
              <Badge className="bg-primary text-primary-foreground">
                {currentReel.subject.name}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-foreground/50 text-background backdrop-blur-sm">
                {formatDuration(currentReel.duration_seconds)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-foreground/30 backdrop-blur-sm text-background hover:bg-foreground/50"
                onClick={() => setIsMuted(prev => !prev)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-20 space-y-3">
            {/* Author with Follow Button */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                {currentReel.center?.logo_url ? (
                  <img 
                    src={currentReel.center.logo_url} 
                    alt={currentReel.center.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary-foreground">
                    {currentReel.center?.name?.charAt(0) || "E"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-background text-sm">
                  {currentReel.center?.name || "Educational Center"}
                </p>
                <p className="text-xs text-background/70">
                  {formatCount(currentReel.views_count)} views
                </p>
              </div>
              {centerId && (
                <Button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  className={`gap-1.5 h-8 ${isFollowing ? 'bg-background/20 border-background/30 text-background hover:bg-background/30' : ''}`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFollowing ? (
                    <UserCheck className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="font-bold text-background text-lg leading-tight">
                {currentReel.title}
              </h3>
              {currentReel.description && (
                <p className="text-sm text-background/80 line-clamp-2 mt-1">
                  {currentReel.description}
                </p>
              )}
            </div>
          </div>

          {/* Side Actions */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
            {/* Like */}
            <motion.button
              className="flex flex-col items-center gap-1"
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isLiked ? "bg-red-500" : "bg-background/20 backdrop-blur-sm"
              }`}>
                <Heart 
                  className={`w-6 h-6 ${isLiked ? "text-white fill-white" : "text-background"}`} 
                />
              </div>
              <span className="text-xs text-background font-medium">
                {formatCount(currentReel.likes_count + (isLiked ? 1 : 0))}
              </span>
            </motion.button>

            {/* Comment */}
            <motion.button
              className="flex flex-col items-center gap-1"
              whileTap={{ scale: 0.9 }}
              onClick={() => toast.info("Comments coming soon")}
            >
              <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-background" />
              </div>
              <span className="text-xs text-background font-medium">0</span>
            </motion.button>

            {/* Save */}
            <motion.button
              className="flex flex-col items-center gap-1"
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isSaved ? "bg-primary" : "bg-background/20 backdrop-blur-sm"
              }`}>
                <BookmarkPlus 
                  className={`w-6 h-6 ${isSaved ? "text-primary-foreground fill-primary-foreground" : "text-background"}`} 
                />
              </div>
              <span className="text-xs text-background font-medium">Save</span>
            </motion.button>

            {/* Share */}
            <motion.button
              className="flex flex-col items-center gap-1"
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
            >
              <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-6 h-6 text-background" />
              </div>
              <span className="text-xs text-background font-medium">Share</span>
            </motion.button>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-background/10 text-background hover:bg-background/20 disabled:opacity-30"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-background/10 text-background hover:bg-background/20 disabled:opacity-30"
              onClick={goToNext}
              disabled={currentIndex === reels.length - 1}
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>

          {/* Reel Counter */}
          <div className="absolute top-4 right-1/2 translate-x-1/2">
            <Badge variant="secondary" className="bg-foreground/50 text-background backdrop-blur-sm">
              {currentIndex + 1} / {reels.length}
            </Badge>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Swipe Hint (first time) */}
      {currentIndex === 0 && reels.length > 1 && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center text-background/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <ChevronUp className="w-5 h-5 animate-bounce" />
          <span className="text-xs">Swipe up for next</span>
        </motion.div>
      )}
    </div>
  );
};
