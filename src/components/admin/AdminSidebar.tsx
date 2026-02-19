import { useMemo } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CreditCard,
  FileCheck,
  LayoutDashboard,
  Palette,
  Settings,
  Users,
  ClipboardList,
  Shield,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export type AdminTabKey =
  | "dashboard"
  | "analytics"
  | "payments"
  | "pending"
  | "users"
  | "subjects"
  | "courses"
  | "tests"
  | "centers"
  | "olympiads"
  | "activity";

type Props = {
  value: AdminTabKey;
  onChange: (next: AdminTabKey) => void;
  pendingCentersCount?: number;
};

const overviewItems: Array<{ key: AdminTabKey; label: string; icon: any; description?: string }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Platform overview" },
  { key: "analytics", label: "Analytics", icon: BarChart3, description: "Reports & insights" },
  { key: "payments", label: "Payments", icon: CreditCard, description: "Revenue & billing" },
];

const managementItems: Array<{ key: AdminTabKey; label: string; icon: any; badge?: boolean }> = [
  { key: "pending", label: "Approvals", icon: FileCheck, badge: true },
  { key: "users", label: "Users", icon: Users },
  { key: "centers", label: "Centers", icon: Building2 },
  { key: "olympiads", label: "Olympiads", icon: Trophy },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "tests", label: "Tests", icon: ClipboardList },
  { key: "subjects", label: "Subjects", icon: Palette },
];

const systemItems: Array<{ key: AdminTabKey; label: string; icon: any }> = [
  { key: "activity", label: "Activity Log", icon: Activity },
];

export function AdminSidebar({ value, onChange, pendingCentersCount = 0 }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const pendingBadge = useMemo(() => {
    if (!pendingCentersCount) return null;
    return (
      <Badge 
        variant="destructive" 
        className="ml-auto h-5 min-w-5 justify-center px-1.5 text-[10px] font-semibold"
      >
        {pendingCentersCount}
      </Badge>
    );
  }, [pendingCentersCount]);

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50">
      {/* Header with branding */}
      <SidebarHeader className="border-b border-border/50">
        <div className={cn(
          "flex items-center gap-3 px-2 py-3",
          collapsed && "justify-center px-0"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-sm">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Admin Panel</span>
              <span className="text-[10px] text-muted-foreground">IMTS Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Overview Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onChange(item.key)}
                    isActive={value === item.key}
                    tooltip={item.label}
                    className={cn(
                      "h-10 rounded-lg transition-all duration-200",
                      value === item.key 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted/80"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* Management Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onChange(item.key)}
                    isActive={value === item.key}
                    tooltip={item.label}
                    className={cn(
                      "h-10 rounded-lg transition-all duration-200",
                      value === item.key 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted/80"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && item.key === "pending" ? pendingBadge : null}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* System Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onChange(item.key)}
                    isActive={value === item.key}
                    tooltip={item.label}
                    className={cn(
                      "h-10 rounded-lg transition-all duration-200",
                      value === item.key 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted/80"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <div className={cn(
          "flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground",
          collapsed && "justify-center px-2"
        )}>
          <Settings className="h-3.5 w-3.5" />
          {!collapsed && <span>⌘B to toggle</span>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
