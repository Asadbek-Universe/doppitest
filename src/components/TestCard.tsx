import { FC, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Star, Coins, Play, ChevronRight, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsSavedItem, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useNavigate } from "react-router-dom";

interface TestCardProps {
  id: string;
  title: string;
  subject: string;
  difficulty: number;
  price: number;
  questionsCount: number;
  duration: number;
  completions: number;
  author: string;
  authorVerified?: boolean;
  isNew?: boolean;
  imageUrl?: string;
}

const difficultyLabels = ["Beginner", "Easy", "Medium", "Hard", "Expert"];
const difficultyColors = [
  "bg-xp/20 text-xp",
  "bg-xp/20 text-xp",
  "bg-coin/20 text-coin",
  "bg-accent/20 text-accent",
  "bg-destructive/20 text-destructive",
];

export const TestCard: FC<TestCardProps> = ({
  id,
  title,
  subject,
  difficulty,
  price,
  questionsCount,
  duration,
  completions,
  author,
  authorVerified = false,
  isNew = false,
  imageUrl,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isSaved } = useIsSavedItem({ userId: user?.id, itemType: "test", itemId: id });
  const toggleSaved = useToggleSavedItem();

  const handleToggleSaved = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleSaved.mutateAsync({ userId: user.id, itemType: "test", itemId: id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="interactive" className="overflow-hidden group">
        {/* Image Header */}
        {imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            {isNew && (
              <Badge variant="new" className="absolute top-3 right-3">
                NEW
              </Badge>
            )}

            <button
              type="button"
              onClick={handleToggleSaved}
              aria-label={isSaved ? "Unsave" : "Save"}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background/90 transition-colors"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-foreground" />
              ) : (
                <BookmarkPlus className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        )}

        <CardContent className={imageUrl ? "pt-3" : "pt-5"}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="subject">{subject}</Badge>
              <Badge className={difficultyColors[difficulty - 1]}>
                {difficultyLabels[difficulty - 1]}
              </Badge>
            </div>
            {price === 0 ? (
              <Badge variant="free">Free</Badge>
            ) : (
              <Badge variant="coin" className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {price}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm text-muted-foreground">{author}</span>
            {authorVerified && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Play className="w-3.5 h-3.5" />
              <span>{questionsCount} questions</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{completions.toLocaleString()}</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="secondary" className="w-full group/btn">
            Start Test
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

