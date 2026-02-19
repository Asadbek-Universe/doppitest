import { FC } from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark, Share2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeedTestCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  tag: "IMTS" | "Center" | "Course";
  imageUrl: string;
}

const tagStyles = {
  IMTS: "bg-primary text-primary-foreground",
  Center: "bg-teal-500 text-white",
  Course: "bg-purple-500 text-white",
};

export const FeedTestCard: FC<FeedTestCardProps> = ({
  id,
  title,
  description,
  difficulty,
  tag,
  imageUrl,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <Badge className={`absolute top-3 right-3 ${tagStyles[tag]}`}>
            {tag}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>

          {/* Difficulty */}
          <div className="text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{difficulty}</span>
            <span className="mx-2">·</span>
            <span>Questions</span>
          </div>

          {/* CTA Button */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Test
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Bookmark className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
