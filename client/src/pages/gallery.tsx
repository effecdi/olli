import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Download, Image as ImageIcon, Wand2, LayoutGrid, Paintbrush, Trees } from "lucide-react";
import type { Generation } from "@shared/schema";

export default function GalleryPage() {
  const [filter, setFilter] = useState<"all" | "character" | "pose" | "background">("all");

  const { data: generations, isLoading } = useQuery<Generation[]>({
    queryKey: ["/api/gallery"],
  });

  const filtered = generations?.filter((g) => {
    if (filter === "all") return true;
    return g.type === filter;
  }) || [];

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `charagen-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-gallery-title">갤러리</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">생성한 모든 캐릭터와 포즈를 확인하세요</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList data-testid="tabs-gallery-filter">
            <TabsTrigger value="all" data-testid="tab-all">전체</TabsTrigger>
            <TabsTrigger value="character" data-testid="tab-characters">캐릭터</TabsTrigger>
            <TabsTrigger value="pose" data-testid="tab-poses">포즈</TabsTrigger>
            <TabsTrigger value="background" data-testid="tab-backgrounds">배경</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3.5 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">아직 이미지가 없어요</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {filter === "all"
              ? "첫 번째 캐릭터를 만들어보세요"
              : `아직 ${filter === "character" ? "캐릭터가" : filter === "pose" ? "포즈가" : "배경이"} 없어요`}
          </p>
          <Button asChild data-testid="button-gallery-create">
            <a href="/create">캐릭터 만들기</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((gen) => (
            <Card key={gen.id} className="overflow-hidden group hover-elevate" data-testid={`card-generation-${gen.id}`}>
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={gen.resultImageUrl}
                  alt={gen.prompt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-end justify-end p-3">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ visibility: "visible" }}
                    onClick={() => downloadImage(gen.resultImageUrl)}
                    data-testid={`button-download-${gen.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-medium truncate">{gen.prompt}</p>
                <div className="flex items-center justify-between flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {gen.type === "character" ? (
                      <><Wand2 className="h-3 w-3 mr-1" />{gen.type}</>
                    ) : gen.type === "background" ? (
                      <><Trees className="h-3 w-3 mr-1" />{gen.type}</>
                    ) : (
                      <><ImageIcon className="h-3 w-3 mr-1" />{gen.type}</>
                    )}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {gen.characterId && (
                      <Link href={`/pose?characterId=${gen.characterId}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs" data-testid={`button-pose-${gen.id}`}>
                          <Paintbrush className="h-3 w-3" />
                          포즈
                        </Button>
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
