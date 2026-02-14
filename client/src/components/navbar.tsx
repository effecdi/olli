import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import {
  Sparkles, Image, LayoutGrid, CreditCard, Moon, Sun, LogOut, Home,
  Wand2, MessageCircle, Target, Eye, ChevronDown, FileText, Paintbrush, Briefcase, MessageSquare, Trees, BookOpen, FolderOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImg from "@assets/logo.png";

interface NavGroup {
  label: string;
  icon: any;
  paths: string[];
  items: { path: string; label: string; icon: any }[];
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const { data: credits } = useQuery<{ credits: number; tier: string }>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const navGroups: NavGroup[] = [
    {
      label: "Create",
      icon: Wand2,
      paths: ["/create", "/gallery", "/background"],
      items: [
        { path: "/create", label: "New Character", icon: Wand2 },
        { path: "/pose", label: "Expression/Pose", icon: Image },
        { path: "/background", label: "Background / Items", icon: Trees },
        { path: "/gallery", label: "Gallery", icon: LayoutGrid },
      ],
    },
    {
      label: "Tools",
      icon: Paintbrush,
      paths: ["/chat", "/effects", "/bubble", "/story", "/edits"],
      items: [
        { path: "/story", label: "Story Editor", icon: BookOpen },
        { path: "/chat", label: "Chat Maker", icon: MessageCircle },
        { path: "/bubble", label: "Speech Bubble", icon: MessageSquare },
        { path: "/effects", label: "Blur Effects", icon: Eye },
        { path: "/edits", label: "My Edits", icon: FolderOpen },
      ],
    },
    {
      label: "Business",
      icon: Briefcase,
      paths: ["/ad-match", "/media-kit"],
      items: [
        { path: "/ad-match", label: "Ad Match AI", icon: Target },
        { path: "/media-kit", label: "Media Kit", icon: FileText },
      ],
    },
  ];

  const isGroupActive = (group: NavGroup) => group.paths.includes(location);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2 cursor-pointer shrink-0">
            <img src={logoImg} alt="OLLI" className="h-8 w-8 rounded-md object-cover" />
            <span className="text-lg font-semibold tracking-tight hidden sm:inline">OLLI</span>
          </div>
        </Link>

        {isAuthenticated && (
          <nav className="flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
            <Link href="/home">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${location === "/home" ? "bg-primary/10 text-primary" : ""}`}
                data-testid="link-landing"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            {navGroups.map((group) => (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 ${isGroupActive(group) ? "bg-primary/10 text-primary" : ""}`}
                    data-testid={`menu-${group.label.toLowerCase()}`}
                  >
                    <group.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{group.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {group.items.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        href={item.path}
                        className="cursor-pointer"
                        data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${location === "/pricing" ? "bg-primary/10 text-primary" : ""}`}
                data-testid="link-pricing"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pricing</span>
              </Button>
            </Link>
          </nav>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {isAuthenticated && credits && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge variant="secondary" data-testid="badge-credits" className="gap-1 bg-primary/10 text-primary border-primary/20 cursor-pointer">
                  <Sparkles className="h-3 w-3" />
                  {credits.tier === "pro" ? "Unlimited" : `${credits.credits} credits`}
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/pose" className="cursor-pointer" data-testid="menu-pose-expression">
                    <Image className="mr-2 h-4 w-4" />
                    포즈/표정
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer" data-testid="menu-dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    대쉬보드
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/gallery" className="cursor-pointer">
                    <Image className="mr-2 h-4 w-4" />
                    My Gallery
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  data-testid="button-logout"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild data-testid="button-login">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
