import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Trash2, FolderOpen, Plus, Loader2, Crown, Clock, MessageCircle, BookOpen } from "lucide-react";
import { useLocation } from "wouter";

interface BubbleProject {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  editorType: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: projects = [], isLoading } = useQuery<BubbleProject[]>({
    queryKey: ["/api/bubble-projects"],
    enabled: isAuthenticated,
  });

  const { data: usage } = useQuery<any>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const isPro = usage?.tier === "pro";

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bubble-projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bubble-projects"] });
      toast({ title: "삭제 완료", description: "프로젝트가 삭제되었습니다." });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast({ title: "삭제 실패", description: err.message, variant: "destructive" });
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2" data-testid="text-login-required-edits">로그인이 필요합니다</h2>
        <p className="text-sm text-muted-foreground mb-5">내 편집 목록을 보려면 로그인해주세요.</p>
        <Button size="sm" asChild data-testid="button-login-edits">
          <a href="/login" className="gap-2">로그인 <ArrowRight className="h-3.5 w-3.5" /></a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-lg font-bold tracking-tight" data-testid="text-edits-title">내 편집</h1>
          <p className="text-xs text-muted-foreground mt-0.5">저장된 프로젝트를 관리하세요</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isPro && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-pro-status">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => setLocation("/bubble")} className="gap-1.5" data-testid="button-new-bubble">
            <MessageCircle className="h-3.5 w-3.5" />
            말풍선
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLocation("/story")} className="gap-1.5" data-testid="button-new-story">
            <BookOpen className="h-3.5 w-3.5" />
            스토리
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-1" data-testid="text-no-projects">저장된 프로젝트가 없습니다</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isPro ? "에디터에서 프로젝트를 저장해보세요." : "Pro 멤버십으로 업그레이드하면 프로젝트를 저장할 수 있습니다."}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setLocation("/bubble")} className="gap-1.5" data-testid="button-go-bubble-editor">
              <MessageCircle className="h-3.5 w-3.5" />
              말풍선 에디터
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLocation("/story")} className="gap-1.5" data-testid="button-go-story-editor">
              <BookOpen className="h-3.5 w-3.5" />
              스토리 에디터
            </Button>
            {!isPro && (
              <Button size="sm" asChild className="gap-1.5" data-testid="button-upgrade-pro-edits">
                <a href="/pricing">
                  <Crown className="h-3.5 w-3.5" />
                  Pro 업그레이드
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer hover-elevate"
              onClick={() => setLocation(`/${project.editorType === "story" ? "story" : "bubble"}?projectId=${project.id}`)}
              data-testid={`card-project-${project.id}`}
            >
              <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-t-md">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    data-testid={`img-project-thumb-${project.id}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(project.id);
                    }}
                    data-testid={`button-delete-project-${project.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-medium truncate flex-1" data-testid={`text-project-name-${project.id}`}>{project.name}</p>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0" data-testid={`badge-editor-type-${project.id}`}>
                    {project.editorType === "story" ? "스토리" : "말풍선"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground" data-testid={`text-project-date-${project.id}`}>
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">프로젝트 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete">
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              className="gap-1.5"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
