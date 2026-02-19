import { FC, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Play, Heart, MessageCircle, Share2, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useAuth } from "@/hooks/useAuth";
import { useIsSavedItem, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useNavigate } from "react-router-dom";

interface ReelCardProps {
  id: string;
  title: string;
  subject: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  author: string;
  authorAvatar?: string;
}

export const ReelCard: FC<ReelCardProps> = ({
  id,
  title,
  subject,
  thumbnailUrl,
  duration,
  views,
  likes,
  author,
  authorAvatar,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isSaved } = useIsSavedItem({
    userId: user?.id,
    itemType: "reel",
    itemId: id,
  });
  const toggleSaved = useToggleSavedItem();

  const handleToggleSaved = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleSaved.mutateAsync({ userId: user.id, itemType: "reel", itemId: id });
  };

  return (
    <motion.div
      className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail */}
      <LazyImage
        src={thumbnailUrl}
        alt={title}
        wrapperClassName="absolute inset-0"
        className="w-full h-full object-cover"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />

      {/* Play Button */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        initial={false}
      >
        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
          <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
        </div>
      </motion.div>

      {/* Duration Badge */}
      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="bg-foreground/80 text-background text-xs">
          {duration}
        </Badge>
      </div>

      {/* Subject Badge */}
      <div className="absolute top-3 left-3">
        <Badge variant="subject">{subject}</Badge>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-semibold text-background text-sm line-clamp-2 mb-2">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {author.charAt(0)}
            </div>
            <span className="text-xs text-background/80">{author}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-background/80">
            <Play className="w-3 h-3" />
            <span>{views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</span>
          </div>
        </div>
      </div>

      {/* Side Actions (visible on hover) */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/40 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="w-5 h-5" />
        </motion.button>
        <motion.button
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/40 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
        <motion.button
          onClick={handleToggleSaved}
          disabled={toggleSaved.isPending}
          aria-label={isSaved ? "Unsave" : "Save"}
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/40 transition-colors disabled:opacity-60"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5" />
          ) : (
            <BookmarkPlus className="w-5 h-5" />
          )}
        </motion.button>
        <motion.button
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/40 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Share2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

