import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsFollowing, useFollowCenter, useUnfollowCenter, useFollowerCount } from '@/hooks/useCenterFollow';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  centerId: string;
  centerName?: string;
  showCount?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export const FollowButton = ({
  centerId,
  centerName,
  showCount = false,
  variant = 'default',
  className = '',
}: FollowButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(centerId);
  const { data: followerCount } = useFollowerCount(centerId);
  const followMutation = useFollowCenter();
  const unfollowMutation = useUnfollowCenter();

  const isLoading = checkingFollow || followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
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

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleClick}
        disabled={isLoading}
        size="sm"
        variant={isFollowing ? 'outline' : 'default'}
        className={`gap-1.5 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={isFollowing ? 'outline' : 'default'}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {followerCount?.toLocaleString() || 0} followers
        </span>
      )}
    </div>
  );
};
