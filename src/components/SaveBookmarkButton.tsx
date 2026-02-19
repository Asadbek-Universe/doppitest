import { FC } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsSavedItem, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SaveBookmarkButtonProps {
  itemId: string;
  itemType: "test" | "course" | "reel" | "center";
  className?: string;
}

export const SaveBookmarkButton: FC<SaveBookmarkButtonProps> = ({
  itemId,
  itemType,
  className = "",
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: isSaved, isLoading } = useIsSavedItem({
    userId: user?.id,
    itemType,
    itemId,
  });
  
  const toggleMutation = useToggleSavedItem();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const result = await toggleMutation.mutateAsync({
        userId: user.id,
        itemType,
        itemId,
      });
      
      toast({
        title: result.saved ? "Saved!" : "Removed",
        description: result.saved 
          ? `Added to your saved ${itemType}s` 
          : `Removed from saved ${itemType}s`,
      });
    } catch (error) {
      console.error("Failed to toggle save:", error);
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || toggleMutation.isPending}
      className={`p-2 hover:bg-muted rounded-lg transition-colors ${className}`}
    >
      {isSaved ? (
        <BookmarkCheck className="w-5 h-5 text-primary" />
      ) : (
        <Bookmark className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
};
