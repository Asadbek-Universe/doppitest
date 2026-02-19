import { FC, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Play, BookOpen, Clock, Star, ChevronRight, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { useAuth } from "@/hooks/useAuth";
import { useIsSavedItem, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  id: string;
  title: string;
  subject: string;
  description: string;
  lessonsCount: number;
  duration: string;
  author: string;
  authorVerified?: boolean;
  rating: number;
  studentsCount: number;
  progress?: number;
  imageUrl?: string;
  isFree?: boolean;
}

export const CourseCard: FC<CourseCardProps> = ({
  id,
  title,
  subject,
  description,
  lessonsCount,
  duration,
  author,
  authorVerified = false,
  rating,
  studentsCount,
  progress,
  imageUrl,
  isFree = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isSaved } = useIsSavedItem({ userId: user?.id, itemType: "course", itemId: id });
  const toggleSaved = useToggleSavedItem();

  const handleToggleSaved = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleSaved.mutateAsync({ userId: user.id, itemType: "course", itemId: id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="interactive" className="overflow-hidden group">
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <LazyImage
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          
          {/* Play overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="subject">{subject}</Badge>
            {isFree && <Badge variant="free">Free</Badge>}
          </div>

          <button
            type="button"
            onClick={handleToggleSaved}
            aria-label={isSaved ? "Unsave" : "Save"}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background/90 transition-colors"
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-foreground" />
            ) : (
              <BookmarkPlus className="w-4 h-4 text-foreground" />
            )}
          </button>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
              <motion.div
                className="h-full bg-gradient-xp"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>

        <CardContent className="pt-4">
          {/* Title */}
          <h3 className="font-bold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm text-muted-foreground">{author}</span>
            {authorVerified && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lessonsCount} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-coin fill-coin" />
              <span className="font-medium text-foreground">{rating}</span>
              <span>({studentsCount.toLocaleString()})</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="secondary" className="w-full group/btn">
            {progress !== undefined ? "Continue Learning" : "Start Course"}
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

