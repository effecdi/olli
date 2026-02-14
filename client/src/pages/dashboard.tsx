import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, FolderOpen, Wand2, BookOpen } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { data: usage } = useQuery<{ credits: number; tier: string }>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
        <p className="text-sm text-muted-foreground mb-5">대쉬보드를 보려면 로그인해주세요.</p>
        <Button asChild size="sm">
          <a href="/login">로그인</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">대쉬보드</h1>
      <p className="text-sm text-muted-foreground mb-6">안녕하세요 {user?.firstName}님</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">크레딧</span>
          </div>
          <p className="text-sm">플랜: {usage?.tier === "pro" ? "Pro" : "Free"}</p>
          <p className="text-sm">잔여 크레딧: {usage?.tier === "pro" ? "Unlimited" : (usage?.credits ?? 0)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">빠른 시작</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" asChild>
              <a href="/create">캐릭터 만들기</a>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href="/bubble">말풍선 에디터</a>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href="/story">스토리 에디터</a>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">내 편집</span>
          </div>
          <p className="text-sm mb-3">최근 작업을 확인하세요.</p>
          <Button size="sm" asChild>
            <a href="/edits">열기</a>
          </Button>
        </Card>
      </div>
    </div>
  );
}
