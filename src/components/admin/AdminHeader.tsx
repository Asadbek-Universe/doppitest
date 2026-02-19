import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  RefreshCw,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { formatDistanceToNow } from 'date-fns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AdminDateRangePicker } from './AdminDateRangePicker';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { AdminTabKey } from './AdminSidebar';

type Props = {
  activeTab: AdminTabKey;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
};

const tabTitles: Record<AdminTabKey, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Platform overview and key metrics' },
  analytics: { title: 'Analytics', description: 'Detailed reports and insights' },
  payments: { title: 'Payments', description: 'Revenue and billing management' },
  pending: { title: 'Approvals', description: 'Review pending verifications' },
  users: { title: 'Users', description: 'Manage platform users' },
  subjects: { title: 'Subjects', description: 'Manage subject categories' },
  courses: { title: 'Courses', description: 'Course content management' },
  tests: { title: 'Tests', description: 'Test management and questions' },
  centers: { title: 'Centers', description: 'Educational centers' },
  olympiads: { title: 'Olympiads', description: 'Olympiad competitions management' },
  activity: { title: 'Activity Log', description: 'System activity and events' },
};

const notifications = [
  { id: 1, title: 'New center registration', description: 'Excellence Academy needs approval', time: new Date(Date.now() - 3600000) },
  { id: 2, title: '5 new users registered', description: 'Today\'s registrations', time: new Date(Date.now() - 7200000) },
];

export const AdminHeader: FC<Props> = ({
  activeTab,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const tabInfo = tabTitles[activeTab];
  const showDatePicker = activeTab === 'dashboard' || activeTab === 'analytics';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin-login');
  };

  const handleProfile = () => {
    // For admin, we could navigate to a profile section or show a modal
    // For now, navigate to profile page
    navigate('/profile');
  };

  const handleSettings = () => {
    // Navigate to settings or show settings modal
    // For now, we'll just log - you can add a settings page later
    console.log('Settings clicked');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-card/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 shrink-0" />
          
          <div className="hidden h-8 w-px bg-border/50 md:block" />
          
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold tracking-tight">{tabInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{tabInfo.description}</p>
          </div>
        </div>

        {/* Center section - Search (desktop only) */}
        <div className="hidden max-w-md flex-1 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, centers, courses..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 w-full rounded-lg border-border/50 bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Date picker */}
          {showDatePicker && onDateRangeChange && (
            <div className="hidden sm:block">
              <AdminDateRangePicker 
                value={dateRange} 
                onChange={onDateRangeChange} 
              />
            </div>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          )}

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Notifications</span>
                  <Badge variant="secondary" className="text-xs">
                    {notifications.length} new
                  </Badge>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="flex gap-3 border-b border-border/30 p-3 last:border-0 hover:bg-muted/50"
                  >
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(notif.time, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50 p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    AD
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50 bg-card">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">Admin User</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email || 'admin@imts.uz'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last updated indicator */}
          {lastUpdated && (
            <div className="hidden text-[10px] text-muted-foreground xl:block">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
