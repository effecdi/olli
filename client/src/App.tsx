import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import HomePage from "@/pages/home";
import CreatePage from "@/pages/create";
import CreateInstatoonPage from "@/pages/create-instatoon";
import PosePage from "@/pages/pose";
import GalleryPage from "@/pages/gallery";
import PricingPage from "@/pages/pricing";
import ChatPage from "@/pages/chat";
import AdMatchPage from "@/pages/ad-match";
import EffectsPage from "@/pages/effects";
import MediaKitPage from "@/pages/media-kit";
import BubblePage from "@/pages/bubble";
import BackgroundPage from "@/pages/background";
import StoryPage from "@/pages/story";
import EditsPage from "@/pages/edits";
import LoginPage from "@/pages/login";
import AuthCallbackPage from "@/pages/auth-callback";
import DashboardPage from "@/pages/dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // BUG FIX 1: When Kakao OAuth redirects back to "/", the URL contains
  // #access_token=... which Supabase needs a moment to parse.
  // If we're on "/" with an OAuth hash, show loading spinner until auth resolves.
  const hasOAuthHash = typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") ||
     window.location.hash.includes("error_description"));

  if (isLoading || hasOAuthHash) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {hasOAuthHash ? "로그인 처리 중..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? HomePage : LandingPage} />
      <Route path="/home" component={LandingPage} />
      <Route path="/create" component={CreatePage} />
      <Route path="/create-instatoon" component={CreateInstatoonPage} />
      <Route path="/pose" component={PosePage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/ad-match" component={AdMatchPage} />
      <Route path="/effects" component={EffectsPage} />
      <Route path="/media-kit" component={MediaKitPage} />
      <Route path="/bubble" component={BubblePage} />
      <Route path="/background" component={BackgroundPage} />
      <Route path="/story" component={StoryPage} />
      <Route path="/edits" component={EditsPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
