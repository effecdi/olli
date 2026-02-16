import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, Plus, Trash2, MessageCircle, ArrowRight, Type, Move, Maximize2, ImagePlus, X, Loader2, Layers, ChevronUp, ChevronDown, Save, Minimize2, ZoomIn, ZoomOut, FolderOpen, Share2, Crown, Lightbulb, Copy, FilePlus } from "lucide-react";
import { useLocation } from "wouter";
import { BubbleCanvas } from "@/components/bubble-canvas";
import { SpeechBubble, CharacterOverlay, PageData, DragMode, BubbleStyle, TailStyle } from "@/lib/bubble-types";
import { generateId, KOREAN_FONTS, STYLE_LABELS, TAIL_LABELS, drawBubble, getTailGeometry, getDefaultTailTip } from "@/lib/bubble-utils";

function bubblePath(n: number) {
  return `/assets/bubbles/bubble_${String(n).padStart(3, "0")}.png`;
}

type TemplateCategory = { label: string; ids: number[] };

const BUBBLE_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    label: "말풍선 (외침/효과)",
    ids: [109, 110, 111, 112, 113],
  },
  {
    label: "이펙트 / 스티커",
    ids: [108, 114, 115, 116, 117],
  },
];

export default function BubblePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const loadProjectId = searchParams.get("id");
  const from = searchParams.get("from");
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [pages, setPages] = useState<PageData[]>([
    { id: generateId(), bubbles: [], characters: [], canvasSize: { width: 522, height: 695 } }
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const activePage = pages[activePageIndex];

  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);


  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateCategoryIdx, setTemplateCategoryIdx] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  const [zoom, setZoom] = useState(100);

  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery<any[]>({
    queryKey: ["/api/gallery"],
    enabled: isAuthenticated,
  });

  const { data: usage } = useQuery<any>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const isPro = usage?.tier === "pro";
  const canAllFonts = isPro || (usage?.creatorTier ?? 0) >= 3;
  const availableFonts = canAllFonts ? KOREAN_FONTS : KOREAN_FONTS.slice(0, 3);

  const showBackButton = from === "story";

  // State helpers
  const updatePage = useCallback((index: number, updates: Partial<PageData>) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  }, []);

  const updateActivePage = useCallback((updates: Partial<PageData>) => {
    updatePage(activePageIndex, updates);
  }, [activePageIndex, updatePage]);

  // Bubble helpers
  const updateBubble = useCallback((bubbleId: string, updates: Partial<SpeechBubble>) => {
    updateActivePage({
      bubbles: activePage.bubbles.map(b => b.id === bubbleId ? { ...b, ...updates } : b)
    });
  }, [activePage, updateActivePage]);

  const updateChar = useCallback((charId: string, updates: Partial<CharacterOverlay>) => {
    updateActivePage({
      characters: activePage.characters.map(c => c.id === charId ? { ...c, ...updates } : c)
    });
  }, [activePage, updateActivePage]);

  const layerItems = useMemo(() => {
    const items: Array<
      | { type: "char"; id: string; z: number; label: string; thumb?: string }
      | { type: "bubble"; id: string; z: number; label: string; thumb?: string }
    > = [
      ...activePage.characters.map((c) => ({
        type: "char" as const,
        id: c.id,
        z: c.zIndex ?? 0,
        label: "캐릭터",
        thumb: c.imageUrl,
      })),
      ...activePage.bubbles.map((b, i) => ({
        type: "bubble" as const,
        id: b.id,
        z: b.zIndex ?? 10,
        label: b.text || STYLE_LABELS[b.style] || `말풍선 ${i + 1}`,
      })),
    ];
    return items.sort((a, b) => b.z - a.z);
  }, [activePage.characters, activePage.bubbles]);

  const [dragLayerIdx, setDragLayerIdx] = useState<number | null>(null);

  const applyLayerOrder = useCallback((ordered: Array<{ type: "char" | "bubble"; id: string }>) => {
    updateActivePage({
      characters: activePage.characters.map((c) => {
        const idx = ordered.findIndex((it) => it.type === "char" && it.id === c.id);
        return idx >= 0 ? { ...c, zIndex: idx } : c;
      }),
      bubbles: activePage.bubbles.map((b) => {
        const idx = ordered.findIndex((it) => it.type === "bubble" && it.id === b.id);
        return idx >= 0 ? { ...b, zIndex: idx } : b;
      }),
    });
  }, [activePage, updateActivePage]);

  const moveLayer = (index: number, direction: "up" | "down") => {
    const items = layerItems;
    if (direction === "up" && index <= 0) return;
    if (direction === "down" && index >= items.length - 1) return;
    const aIdx = index;
    const bIdx = direction === "up" ? index - 1 : index + 1;
    const a = items[aIdx];
    const b = items[bIdx];
    const newAz = b.z;
    const newBz = a.z;
    if (a.type === "char") {
      updateActivePage({
        characters: activePage.characters.map((c) => (c.id === a.id ? { ...c, zIndex: newAz } : c)),
      });
    } else {
      updateActivePage({
        bubbles: activePage.bubbles.map((bb) => (bb.id === a.id ? { ...bb, zIndex: newAz } : bb)),
      });
    }
    if (b.type === "char") {
      updateActivePage({
        characters: activePage.characters.map((c) => (c.id === b.id ? { ...c, zIndex: newBz } : c)),
      });
    } else {
      updateActivePage({
        bubbles: activePage.bubbles.map((bb) => (bb.id === b.id ? { ...bb, zIndex: newBz } : bb)),
      });
    }
  };

  const addBubble = () => {
    const newBubble: SpeechBubble = {
      id: generateId(),
      seed: Math.floor(Math.random() * 1000000),
      x: activePage.canvasSize.width / 2 - 80,
      y: activePage.canvasSize.height / 2 - 40,
      width: 160,
      height: 80,
      text: "",
      style: "linedrawing",
      tailStyle: "short",
      tailDirection: "bottom",
      tailBaseSpread: 8,
      tailLength: undefined,
      tailCurve: 0.5,
      tailJitter: 1,
      dotsScale: 1,
      dotsSpacing: 1,
      strokeWidth: 2,
      wobble: 5,
      fontSize: 14,
      fontKey: "default",
      zIndex: 10,
    };
    updateActivePage({ bubbles: [...activePage.bubbles, newBubble] });
    setSelectedBubbleId(newBubble.id);
    setSelectedCharId(null);
  };

  const addPage = () => {
    const newPage: PageData = {
      id: generateId(),
      bubbles: [],
      characters: [],
      canvasSize: { width: 522, height: 695 },
    };
    setPages(prev => [...prev, newPage]);
    setActivePageIndex(pages.length); // Select new page
    toast({ title: "페이지 추가됨", description: "새로운 페이지가 생성되었습니다." });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      toast({ title: "삭제 불가", description: "최소 1개의 페이지가 필요합니다.", variant: "destructive" });
      return;
    }
    setPages(prev => prev.filter((_, i) => i !== index));
    if (activePageIndex >= index && activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  const duplicatePage = (index: number) => {
    const p = pages[index];
    const newPage: PageData = {
      ...p,
      id: generateId(),
      bubbles: p.bubbles.map(b => ({ ...b, id: generateId() })),
      characters: p.characters.map(c => ({ ...c, id: generateId() })),
    };
    setPages(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, newPage);
      return next;
    });
    toast({ title: "페이지 복제됨" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Fit to active canvas or resize canvas?
        // Typically resize canvas to match image, but max constrained
        const maxW = 800;
        const maxH = 1000;
        let w = img.width;
        let h = img.height;
        const s = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * s);
        h = Math.round(h * s);

        updateActivePage({
          imageElement: img,
          imageDataUrl: ev.target?.result as string,
          canvasSize: { width: w, height: h },
          bubbles: [], // Clear bubbles on new image? Or keep? keeping seems safer but bubble positions might be off. 
          // Original code cleared bubbles. Let's keep that behavior or ask?
          // "setBubbles([])" was in original.
        });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRefs.current.get(activePage.id);
    if (!canvas) return;

    // Temporary canvas to render high quality?
    // Or just download current
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `bubble-page-${activePageIndex + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  const { data: loadedProject } = useQuery<any>({
    queryKey: ["/api/bubble-projects", loadProjectId],
    enabled: isAuthenticated && !!loadProjectId,
  });

  const projectLoadedRef = useRef(false);
  useEffect(() => {
    if (loadedProject && !projectLoadedRef.current) {
      projectLoadedRef.current = true;
      setCurrentProjectId(loadedProject.id);
      setProjectName(loadedProject.name);
      try {
        const data = JSON.parse(loadedProject.canvasData);
        if (data.pages) {
          setPages(data.pages.map((p: PageData) => ({
            ...p,
            bubbles: p.bubbles.map(b => {
              if (b.templateSrc && !b.templateImg) {
                const img = new Image();
                img.src = b.templateSrc;
                img.crossOrigin = "anonymous";
                return { ...b, templateImg: img };
              }
              return b;
            }),
            characters: p.characters.map(c => {
              if (c.imageUrl && !c.imgElement) {
                const img = new Image();
                img.src = c.imageUrl;
                img.crossOrigin = "anonymous";
                return { ...c, imgElement: img };
              }
              return c;
            }),
            imageElement: p.imageDataUrl ? (() => {
              const img = new Image();
              img.src = p.imageDataUrl;
              img.crossOrigin = "anonymous";
              return img;
            })() : undefined
          })));
        } else {
          const newPage: PageData = {
            id: generateId(),
            bubbles: (data.bubbles || []).map((b: any) => {
              if (b.templateSrc) {
                const img = new Image();
                img.src = b.templateSrc;
                img.crossOrigin = "anonymous";
                return { ...b, templateImg: img };
              }
              return b;
            }),
            characters: (data.characterOverlays || []).map((c: any) => {
              if (c.imageUrl) {
                const img = new Image();
                img.src = c.imageUrl;
                img.crossOrigin = "anonymous";
                return { ...c, imgElement: img };
              }
              return c;
            }),
            canvasSize: data.canvasSize || { width: 522, height: 695 },
            imageDataUrl: data.imageDataUrl,
            imageElement: data.imageDataUrl ? (() => {
              const img = new Image();
              img.src = data.imageDataUrl;
              img.crossOrigin = "anonymous";
              return img;
            })() : undefined
          };
          setPages([newPage]);
        }
      } catch (e) {
        console.error("Failed to load project:", e);
        toast({ title: "프로젝트 로드 실패", variant: "destructive" });
      }
    }
  }, [loadedProject, toast]);

  const selectedBubble = activePage.bubbles.find(b => b.id === selectedBubbleId);
  const selectedChar = activePage.characters.find(c => c.id === selectedCharId);

  const startBubbleTour = useCallback(() => {
    const ensureDriver = () =>
      new Promise<void>((resolve) => {
        const hasDriver = (window as any)?.driver?.js?.driver;
        if (hasDriver) {
          resolve();
          return;
        }
        const cssId = "driverjs-css";
        if (!document.getElementById(cssId)) {
          const link = document.createElement("link");
          link.id = cssId;
          link.rel = "stylesheet";
          link.href = "https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.css";
          document.head.appendChild(link);
        }
        const scriptId = "driverjs-script";
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.js.iife.js";
          script.onload = () => resolve();
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });
    ensureDriver().then(() => {
      const driver = (window as any).driver.js.driver;
      const driverObj = driver({
        overlayColor: "rgba(0,0,0,0.6)",
        showProgress: true,
        steps: [
          {
            element: '[data-testid="bubble-toolbar"]',
            popover: { title: "말풍선 툴바", description: "다운로드, 배경 이미지, 저장 등을 할 수 있어요." },
          },
          {
            element: '[data-testid="button-download-bubble"]',
            popover: { title: "다운로드", description: "현재 페이지를 이미지로 저장합니다." },
          },
          {
            element: '[data-testid="button-upload-bubble-bg"]',
            popover: { title: "배경 이미지", description: "말풍선 뒤에 깔릴 배경 이미지를 설정합니다." },
          },
          {
            element: '[data-testid="button-save-bubble-project"]',
            popover: { title: "프로젝트 저장", description: "작업을 프로젝트로 저장해두고 다시 불러올 수 있어요." },
          },
          {
            element: '[data-testid="bubble-canvas-area"]',
            popover: { title: "캔버스", description: "말풍선과 캐릭터를 배치하고 크기를 조절해보세요." },
          },
          {
            element: '[data-testid="bubble-right-panel"]',
            popover: { title: "속성 패널", description: "텍스트, 폰트, 꼬리 방향 등 세부 옵션을 바꿉니다." },
          },
        ],
      });
      driverObj.drive();
    });
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Top bar - Story 스타일과 통일 */}
      <header className="flex h-14 items-center border-b bg-background px-4" data-testid="bubble-toolbar">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="ghost" size="icon" onClick={() => setLocation("/story")}>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
            )}
            <h1 className="text-base font-semibold">말풍선 편집기</h1>
            {isPro && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3 text-yellow-500" /> Pro
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleDownload}
              title="다운로드"
              data-testid="button-download-bubble"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs px-2.5"
              onClick={() => document.getElementById("bg-upload")?.click()}
              data-testid="button-upload-bubble-bg"
            >
              <Upload className="h-3.5 w-3.5" />
              배경 이미지
            </Button>
            <input
              type="file"
              id="bg-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Button
              size="sm"
              onClick={() => setShowSaveModal(true)}
              className="gap-1.5 h-8 text-xs px-2.5 bg-[hsl(173_100%_35%)] text-white border-[hsl(173_100%_35%)]"
              data-testid="button-save-bubble-project"
            >
              <Save className="h-3.5 w-3.5" />
              저장
              {isPro && <Crown className="h-3 w-3 ml-0.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={startBubbleTour}
              title="도움말"
              data-testid="button-bubble-help"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setLocation("/edits")}
              title="내 편집"
              data-testid="button-bubble-my-edits"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" data-testid="bubble-canvas-area">

        <div className="w-[320px] overflow-y-auto border-r bg-background p-4" data-testid="bubble-right-panel">
          <div className="mb-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={addBubble}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs">말풍선</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={() => setShowGalleryPicker(true)}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span className="text-xs">캐릭터</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={() => setShowTemplatePicker(true)}
              >
                <Type className="h-3.5 w-3.5" />
                <span className="text-xs">템플릿</span>
              </Button>
            </div>
          </div>
          {(activePage.characters.length > 0 || activePage.bubbles.length > 0) && (
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">
                  레이어 목록 ({layerItems.length})
                </span>
              </div>
              {layerItems.map((item, i) => (
                <div
                  key={`${item.type}:${item.id}`}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                    item.type === "char"
                      ? selectedCharId === item.id
                        ? "bg-primary/10"
                        : "hover-elevate"
                      : selectedBubbleId === item.id
                        ? "bg-primary/10"
                        : "hover-elevate"
                  }`}
                  onClick={() => {
                    if (item.type === "char") {
                      setSelectedCharId(item.id);
                      setSelectedBubbleId(null);
                    } else {
                      setSelectedBubbleId(item.id);
                      setSelectedCharId(null);
                    }
                  }}
                  draggable
                  onDragStart={() => setDragLayerIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragLayerIdx === null || dragLayerIdx === i) return;
                    const base = layerItems.map((li) => ({ type: li.type, id: li.id }));
                    const moved = base[dragLayerIdx];
                    const rest = base.filter((_, idx) => idx !== dragLayerIdx);
                    const newOrder = [...rest.slice(0, i), moved, ...rest.slice(i)];
                    applyLayerOrder(newOrder);
                    setDragLayerIdx(null);
                  }}
                  data-testid={`row-layer-${i}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded overflow-hidden shrink-0 border border-border bg-muted">
                      {item.thumb ? (
                        <img src={item.thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px]">
                          {item.type === "bubble" ? "B" : "C"}
                        </div>
                      )}
                    </div>
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={i === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(i, "up");
                      }}
                      title="앞으로"
                      data-testid={`button-moveup-layer-${i}`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={i === layerItems.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(i, "down");
                      }}
                      title="뒤로"
                      data-testid={`button-movedown-layer-${i}`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === "char") {
                          updateActivePage({
                            characters: activePage.characters.filter((c) => c.id !== item.id),
                          });
                          if (selectedCharId === item.id) {
                            setSelectedCharId(null);
                          }
                        } else {
                          updateActivePage({
                            bubbles: activePage.bubbles.filter((b) => b.id !== item.id),
                          });
                          if (selectedBubbleId === item.id) {
                            setSelectedBubbleId(null);
                          }
                        }
                      }}
                      data-testid={`button-delete-layer-${i}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Text/Bubble Controls when selected */}
          {selectedBubble ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">말풍선 편집</h3>
                <Button variant="ghost" size="icon" onClick={() => updateActivePage({ bubbles: activePage.bubbles.filter(b => b.id !== selectedBubbleId) })}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>텍스트</Label>
                <Textarea
                  value={selectedBubble.text}
                  onChange={(e) => updateBubble(selectedBubble.id, { text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>폰트</Label>
                <Select value={selectedBubble.fontKey} onValueChange={(v) => updateBubble(selectedBubble.id, { fontKey: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableFonts.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        <span style={{ fontFamily: f.family }}>{f.label}</span>
                      </SelectItem>
                    ))}
                    {!canAllFonts && (
                      <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                        Pro 멤버십 또는 프로 연재러(30회+) 등급에서 전체 폰트 해금
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">글자 크기</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedBubble.fontSize}px
                  </span>
                </div>
                <Slider
                  value={[selectedBubble.fontSize]}
                  onValueChange={([v]) => updateBubble(selectedBubble.id, { fontSize: v })}
                  min={8}
                  max={40}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>스타일</Label>
                <Select value={selectedBubble.style} onValueChange={(v) => updateBubble(selectedBubble.id, { style: v as BubbleStyle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STYLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">꼬리 방향</Label>
                  <Select value={selectedBubble.tailDirection} onValueChange={(v: any) => updateBubble(selectedBubble.id, { tailDirection: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom">아래</SelectItem>
                      <SelectItem value="top">위</SelectItem>
                      <SelectItem value="left">왼쪽</SelectItem>
                      <SelectItem value="right">오른쪽</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : selectedChar ? (
            <div className="space-y-4">
              <h3 className="font-medium">캐릭터 편집</h3>
              <Button variant="ghost" className="w-full justify-start text-red-500" onClick={() => updateActivePage({ characters: activePage.characters.filter(c => c.id !== selectedCharId) })}>
                <Trash2 className="mr-2 h-4 w-4" /> 삭제
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">도구</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={addBubble} className="h-20 flex-col gap-2">
                    <MessageCircle className="h-6 w-6" />
                    말풍선 추가
                  </Button>
                  <Button variant="outline" onClick={() => setShowGalleryPicker(true)} className="h-20 flex-col gap-2">
                    <ImagePlus className="h-6 w-6" />
                    캐릭터 추가
                  </Button>
                  <Button variant="outline" onClick={() => setShowTemplatePicker(true)} className="h-20 flex-col gap-2">
                    <Type className="h-6 w-6" />
                    템플릿
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area - Scrollable List */}
        <div className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/10 p-8">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 pb-32">
            {pages.map((page, i) => (
              <ContextMenu key={page.id}>
                <ContextMenuTrigger>
                  <div
                    onClick={() => setActivePageIndex(i)}
                    className={`relative shadow-lg transition-all ${activePageIndex === i ? "ring-4 ring-primary ring-offset-2" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="absolute -left-12 top-0 flex flex-col gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold shadow-sm ${activePageIndex === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                    </div>
                    {pages.length > 1 && (
                      <button
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-red-500 shadow hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(i);
                        }}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <BubbleCanvas
                      page={page}
                      isActive={activePageIndex === i}
                      zoom={zoom}
                      onUpdateBubble={(id, u) => updatePage(i, { bubbles: page.bubbles.map(b => b.id === id ? { ...b, ...u } : b) })}
                      onUpdateChar={(id, u) => updatePage(i, { characters: page.characters.map(c => c.id === id ? { ...c, ...u } : c) })}
                      onSelectBubble={(id) => { setSelectedBubbleId(id); if (id) { setSelectedCharId(null); setActivePageIndex(i); } }}
                      onSelectChar={(id) => { setSelectedCharId(id); if (id) { setSelectedBubbleId(null); setActivePageIndex(i); } }}
                      selectedBubbleId={activePageIndex === i ? selectedBubbleId : null}
                      selectedCharId={activePageIndex === i ? selectedCharId : null}
                      onCanvasRef={(el) => { if (el) canvasRefs.current.set(page.id, el); else canvasRefs.current.delete(page.id); }}
                      onEditBubble={(id) => { }}
                      showWatermark={!isPro}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Page {i + 1}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => duplicatePage(i)}><Copy className="mr-2 h-4 w-4" /> Duplicate Page</ContextMenuItem>
                  <ContextMenuItem onClick={() => deletePage(i)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete Page</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}

            <Button variant="outline" className="h-24 w-full max-w-[500px] border-dashed" onClick={addPage}>
              <FilePlus className="mr-2 h-6 w-6 text-muted-foreground/70" />
              <span className="text-muted-foreground">Add New Page</span>
            </Button>
          </div>
        </div>
      </div>




      {/* Gallery Picker Dialog */}
      <Dialog open={showGalleryPicker} onOpenChange={setShowGalleryPicker}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>캐릭터 불러오기</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-3 gap-4 overflow-y-auto sm:grid-cols-4">
                {galleryItems?.map((item: any) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:ring-2 hover:ring-primary"
                onClick={() => {
                  // Assuming helper function from original file is adapted inline or we use logic here
                  // For brevity, using inline simplified logic
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  img.src = item.resultImageUrl;
                  img.onload = () => {
                    const newChar = {
                      id: generateId(), imageUrl: item.resultImageUrl, imgElement: img,
                      x: 100, y: 100, width: 200, height: 200, originalWidth: img.width, originalHeight: img.height,
                      label: item.prompt || "Character", zIndex: 10
                    };
                    updateActivePage({ characters: [...activePage.characters, newChar] });
                    setShowGalleryPicker(false);
                  };
                }}
              >
                <img src={item.resultImageUrl} alt="Gallery" className="aspect-square h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>말풍선 템플릿</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            {BUBBLE_TEMPLATE_CATEGORIES.map((cat, i) => (
              <Button key={i} variant={templateCategoryIdx === i ? "default" : "outline"} onClick={() => setTemplateCategoryIdx(i)} size="sm">
                {cat.label}
              </Button>
            ))}
          </div>
          <div className="grid max-h-[60vh] grid-cols-4 gap-4 overflow-y-auto">
            {BUBBLE_TEMPLATE_CATEGORIES[templateCategoryIdx].ids.map(id => (
              <div key={id} className="cursor-pointer rounded border bg-card p-2 hover:bg-muted" onClick={() => {
                // Logic to add template bubble
                const path = bubblePath(id);
                const img = new Image(); img.src = path;
                img.onload = () => {
                  const newB = {
                    id: generateId(), seed: 0, x: 100, y: 100, width: 200, height: 150,
                    text: "", style: "image" as BubbleStyle, tailStyle: "none" as TailStyle, tailDirection: "bottom" as const,
                    strokeWidth: 0, wobble: 0, fontSize: 16, fontKey: "default", templateSrc: path, templateImg: img, zIndex: 10
                  };
                  updateActivePage({ bubbles: [...activePage.bubbles, newB] });
                  setShowTemplatePicker(false);
                };
              }}>
                <img src={bubblePath(id)} className="h-24 w-full object-contain" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>프로젝트 명 저장</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>프로젝트 이름</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="나의 웹툰" />
            </div>
            <Button className="w-full" onClick={() => {
              // Save logic
              const saveData = {
                pages: pages.map(p => ({
                  ...p,
                  bubbles: p.bubbles.map(b => ({ ...b, templateImg: undefined })), // stripping non-serializable
                  characters: p.characters.map(c => ({ ...c, imgElement: undefined })),
                  imageElement: undefined
                })),
                version: 2
              };
              // apiRequest call ...
              toast({ title: "저장되었습니다 (Mock)" });
              setShowSaveModal(false);
            }}>저장</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
