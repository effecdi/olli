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
import { Upload, Download, Plus, Trash2, MessageCircle, ArrowRight, Type, Move, Maximize2, ImagePlus, X, Loader2, Layers, ChevronUp, ChevronDown, Save, Minimize2, ZoomIn, ZoomOut, FolderOpen, Share2, Crown, Lightbulb, Copy, FilePlus, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { BubbleCanvas } from "@/components/bubble-canvas";
import { SpeechBubble, CharacterOverlay, PageData, DragMode, BubbleStyle, TailStyle } from "@/lib/bubble-types";
import { generateId, KOREAN_FONTS, STYLE_LABELS, FLASH_STYLE_LABELS, TAIL_LABELS, drawBubble, getTailGeometry, getDefaultTailTip } from "@/lib/bubble-utils";

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
  const [removingBg, setRemovingBg] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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

  const deleteSelectedElement = useCallback(() => {
    if (selectedBubbleId) {
      updateActivePage({
        bubbles: activePage.bubbles.filter((b) => b.id !== selectedBubbleId),
      });
      setSelectedBubbleId(null);
    } else if (selectedCharId) {
      updateActivePage({
        characters: activePage.characters.filter((c) => c.id !== selectedCharId),
      });
      setSelectedCharId(null);
    }
  }, [activePage, selectedBubbleId, selectedCharId, updateActivePage]);

  const bringSelectedLayerForward = useCallback(() => {
    if (!selectedBubbleId && !selectedCharId) return;
    const idx = layerItems.findIndex((it) =>
      selectedCharId ? it.type === "char" && it.id === selectedCharId : it.type === "bubble" && it.id === selectedBubbleId
    );
    if (idx < 0) return;
    moveLayer(idx, "up");
  }, [layerItems, moveLayer, selectedBubbleId, selectedCharId]);

  const sendSelectedLayerBackward = useCallback(() => {
    if (!selectedBubbleId && !selectedCharId) return;
    const idx = layerItems.findIndex((it) =>
      selectedCharId ? it.type === "char" && it.id === selectedCharId : it.type === "bubble" && it.id === selectedBubbleId
    );
    if (idx < 0) return;
    moveLayer(idx, "down");
  }, [layerItems, moveLayer, selectedBubbleId, selectedCharId]);

  const toggleLockSelectedElement = useCallback(() => {
    if (selectedBubbleId) {
      const b = activePage.bubbles.find((bb) => bb.id === selectedBubbleId);
      if (!b) return;
      updateBubble(selectedBubbleId, { locked: !b.locked });
    } else if (selectedCharId) {
      const c = activePage.characters.find((cc) => cc.id === selectedCharId);
      if (!c) return;
      updateChar(selectedCharId, { locked: !c.locked });
    }
  }, [activePage, selectedBubbleId, selectedCharId, updateBubble, updateChar]);

  const groupSelectedBubbleWithAbove = useCallback(() => {
    if (!selectedBubbleId) return;
    const bubbles = activePage.bubbles;
    const current = bubbles.find((b) => b.id === selectedBubbleId);
    if (!current) return;
    const sorted = [...bubbles].sort((a, b) => (a.zIndex ?? 10) - (b.zIndex ?? 10));
    const idx = sorted.findIndex((b) => b.id === current.id);
    const neighbor = sorted[idx + 1] ?? sorted[idx - 1];
    const groupId = generateId();
    const ids = [current.id, ...(neighbor ? [neighbor.id] : [])];
    updateActivePage({
      bubbles: bubbles.map((b) =>
        ids.includes(b.id) ? { ...b, groupId } : b,
      ),
    });
  }, [activePage, selectedBubbleId, updateActivePage]);

  const ungroupSelectedBubble = useCallback(() => {
    if (!selectedBubbleId) return;
    const bubbles = activePage.bubbles;
    const current = bubbles.find((b) => b.id === selectedBubbleId);
    if (!current || !current.groupId) return;
    const gid = current.groupId;
    updateActivePage({
      bubbles: bubbles.map((b) =>
        b.groupId === gid ? { ...b, groupId: undefined } : b,
      ),
    });
  }, [activePage, selectedBubbleId, updateActivePage]);

  const rotateSelectedElement = useCallback(() => {
    if (!selectedCharId) return;
    const c = activePage.characters.find((cc) => cc.id === selectedCharId);
    if (!c) return;
    const next = (c.rotation || 0) + Math.PI / 12;
    updateChar(selectedCharId, { rotation: next });
  }, [activePage, selectedCharId, updateChar]);

  const copySelectedElement = useCallback(() => {
    if (selectedBubbleId) {
      const b = activePage.bubbles.find((bb) => bb.id === selectedBubbleId);
      if (!b) return;
      localStorage.setItem("olli_clipboard", JSON.stringify({ type: "bubble", data: b }));
      toast({ title: "복사됨", description: "말풍선이 복사되었습니다." });
    } else if (selectedCharId) {
      const c = activePage.characters.find((cc) => cc.id === selectedCharId);
      if (!c) return;
      localStorage.setItem("olli_clipboard", JSON.stringify({ type: "char", data: c }));
      toast({ title: "복사됨", description: "캐릭터가 복사되었습니다." });
    }
  }, [activePage, selectedBubbleId, selectedCharId, toast]);

  const pasteFromClipboard = useCallback(() => {
    try {
      const raw = localStorage.getItem("olli_clipboard");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.type === "bubble") {
        const b = parsed.data as SpeechBubble;
        const maxZ = activePage.bubbles.reduce((acc, cur) => Math.max(acc, cur.zIndex ?? 10), 10);
        const newBubble: SpeechBubble = {
          ...b,
          id: generateId(),
          x: b.x + 20,
          y: b.y + 20,
          zIndex: maxZ + 1,
        };
        updateActivePage({ bubbles: [...activePage.bubbles, newBubble] });
        setSelectedBubbleId(newBubble.id);
        setSelectedCharId(null);
      } else if (parsed.type === "char") {
        const c = parsed.data as CharacterOverlay;
        const maxZ = activePage.characters.reduce((acc, cur) => Math.max(acc, cur.zIndex ?? 0), 0);
        const newChar: CharacterOverlay = {
          ...c,
          id: generateId(),
          x: c.x + 20,
          y: c.y + 20,
          zIndex: maxZ + 1,
        };
        updateActivePage({ characters: [...activePage.characters, newChar] });
        setSelectedCharId(newChar.id);
        setSelectedBubbleId(null);
      }
      toast({ title: "붙여넣기 완료" });
    } catch {
      toast({ title: "붙여넣기 실패", description: "클립보드 데이터를 읽을 수 없습니다.", variant: "destructive" });
    }
  }, [activePage, updateActivePage, toast]);

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
      shapeSides: 6,
      shapeCornerRadius: 8,
      shapeWobble: 0,
      shapeSpikeCount: 12,
      shapeSpikeHeight: 20,
      shapeSpikeSharpness: 0.7,
      shapeBumpCount: 8,
      shapeBumpSize: 15,
      shapeBumpRoundness: 0.8,
      zIndex: 10,
      groupId: undefined,
    };
    updateActivePage({ bubbles: [...activePage.bubbles, newBubble] });
    setSelectedBubbleId(newBubble.id);
    setSelectedCharId(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (!selectedBubbleId && !selectedCharId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedElement();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        if (e.key === "]") {
          bringSelectedLayerForward();
        } else {
          sendSelectedLayerBackward();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelectedElement, bringSelectedLayerForward, sendSelectedLayerBackward, selectedBubbleId, selectedCharId]);

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

  const handleDownloadAll = () => {
    pages.forEach((page, index) => {
      const canvas = canvasRefs.current.get(page.id);
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `bubble-page-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    });
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

  const handleFlipTailHorizontally = useCallback(() => {
    if (!selectedBubble) return;
    const b = selectedBubble;
    if (b.tailStyle === "none") return;

    const cx = b.x + b.width / 2;
    const defaultTip = getDefaultTailTip(b);
    const origTipX = b.tailTipX ?? defaultTip?.x ?? cx;
    const origTipY = b.tailTipY ?? defaultTip?.y ?? (b.y + b.height);

    const updates: Partial<SpeechBubble> = {
      tailTipX: 2 * cx - origTipX,
      tailTipY: origTipY,
    };

    if (typeof b.tailCtrl1X === "number" && typeof b.tailCtrl1Y === "number") {
      updates.tailCtrl1X = 2 * cx - b.tailCtrl1X;
      updates.tailCtrl1Y = b.tailCtrl1Y;
    }
    if (typeof b.tailCtrl2X === "number" && typeof b.tailCtrl2Y === "number") {
      updates.tailCtrl2X = 2 * cx - b.tailCtrl2X;
      updates.tailCtrl2Y = b.tailCtrl2Y;
    }

    updateBubble(b.id, updates);
  }, [selectedBubble, updateBubble]);

  const handleRemoveBackground = async () => {
    if (!selectedChar) return;
    if (!isPro) {
      toast({
        title: "Pro 전용 기능",
        description: "배경제거는 Pro 멤버십 전용 기능입니다.",
        variant: "destructive",
      });
      return;
    }
    try {
      setRemovingBg(true);
      const res = await apiRequest("POST", "/api/remove-background", {
        sourceImageData: selectedChar.imageUrl,
      });
      const data = await res.json();
      const imageUrl = data.imageUrl as string;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        updateActivePage({
          characters: activePage.characters.map((c) =>
            c.id === selectedChar.id ? { ...c, imageUrl, imgElement: img } : c,
          ),
        });
        toast({ title: "배경 제거 완료" });
      };
      img.src = imageUrl;
    } catch (error: any) {
      toast({
        title: "배경 제거 실패",
        description: error?.message || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setRemovingBg(false);
    }
  };

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
              onClick={handleDownloadAll}
              data-testid="button-download-bubble-all"
            >
              <Download className="h-3.5 w-3.5" />
              전체 다운로드
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
              onClick={() => {
                if (!isAuthenticated) {
                  toast({
                    title: "로그인 필요",
                    description: "로그인 후 프로젝트를 저장할 수 있습니다.",
                    variant: "destructive",
                  });
                  setLocation("/login");
                  return;
                }
                if (!isPro) {
                  toast({
                    title: "Pro 전용 기능",
                    description: "말풍선 프로젝트 저장은 Pro 업그레이드 후 이용할 수 있습니다.",
                    variant: "destructive",
                  });
                  setLocation("/pricing");
                  return;
                }
                setShowSaveModal(true);
              }}
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
            <div className="space-y-0 divide-y">

              {/* ── 섹션1: 텍스트 ── */}
              <div className="py-3 space-y-2 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">텍스트</span>
                <Textarea
                  value={selectedBubble.text}
                  onChange={(e) => updateBubble(selectedBubble.id, { text: e.target.value })}
                  className="text-sm min-h-[60px]"
                />
                <Select
                  value={selectedBubble.fontKey}
                  onValueChange={(v) => updateBubble(selectedBubble.id, { fontKey: v })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableFonts.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        <span style={{ fontFamily: f.family }}>{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                    글자크기 {selectedBubble.fontSize}px
                  </span>
                  <Slider
                    value={[selectedBubble.fontSize]}
                    onValueChange={([v]) => updateBubble(selectedBubble.id, { fontSize: v })}
                    min={8} max={40} step={1} className="flex-1"
                  />
                </div>
              </div>

              {/* ── 섹션2: 말풍선 형태 ── */}
              <div className="py-3 space-y-2 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">말풍선 형태</span>

                {/* 일반 스타일 버튼 그리드 */}
                <div className="grid grid-cols-3 gap-1">
                  {(["linedrawing","handwritten","wobbly","thought","shout","rectangle","rounded","doubleline","wavy","polygon","spiky","cloud"] as BubbleStyle[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateBubble(selectedBubble.id, { style: s })}
                      className={`rounded border px-1.5 py-1 text-[10px] text-center transition-colors ${
                        selectedBubble.style === s
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {STYLE_LABELS[s]}
                    </button>
                  ))}
                </div>

                {selectedBubble.style === "polygon" && (
                  <div className="space-y-1.5 border-t pt-2">
                    <span className="text-[10px] font-medium text-muted-foreground">다각형 설정</span>
                    {([
                      { label: "꼭짓점", key: "shapeSides", min: 3, max: 12, step: 1, def: 6 },
                      { label: "둥글기", key: "shapeCornerRadius", min: 0, max: 50, step: 1, def: 8 },
                      { label: "불규칙", key: "shapeWobble", min: 0, max: 20, step: 1, def: 0 },
                    ] as const).map(({ label, key, min, max, step, def }) => {
                      const val = (selectedBubble as any)[key] ?? def;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                            {label} {val}
                          </span>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)}
                            min={min}
                            max={max}
                            step={step}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedBubble.style === "spiky" && (
                  <div className="space-y-1.5 border-t pt-2">
                    <span className="text-[10px] font-medium text-muted-foreground">뾰족한 설정</span>
                    {([
                      { label: "개수", key: "shapeSpikeCount", min: 4, max: 30, step: 1, def: 12 },
                      { label: "높이", key: "shapeSpikeHeight", min: 2, max: 80, step: 1, def: 20 },
                      { label: "날카로움", key: "shapeSpikeSharpness", min: 0, max: 1, step: 0.05, def: 0.7 },
                      { label: "불규칙", key: "shapeWobble", min: 0, max: 20, step: 1, def: 0 },
                    ] as const).map(({ label, key, min, max, step, def }) => {
                      const val = (selectedBubble as any)[key] ?? def;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                            {label} {step < 1 ? (val as number).toFixed(2) : val}
                          </span>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)}
                            min={min}
                            max={max}
                            step={step}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedBubble.style === "cloud" && (
                  <div className="space-y-1.5 border-t pt-2">
                    <span className="text-[10px] font-medium text-muted-foreground">구름 설정</span>
                    {([
                      { label: "bump수", key: "shapeBumpCount", min: 4, max: 20, step: 1, def: 8 },
                      { label: "bump크기", key: "shapeBumpSize", min: 3, max: 40, step: 1, def: 15 },
                      { label: "둥글기", key: "shapeBumpRoundness", min: 0, max: 1, step: 0.05, def: 0.8 },
                    ] as const).map(({ label, key, min, max, step, def }) => {
                      const val = (selectedBubble as any)[key] ?? def;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                            {label} {step < 1 ? (val as number).toFixed(2) : val}
                          </span>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)}
                            min={min}
                            max={max}
                            step={step}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 선/채색 모드 선택 */}
                <div className="grid grid-cols-3 gap-1">
                  {([["both","선+채색"],["fill_only","채색만"],["stroke_only","선만"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => updateBubble(selectedBubble.id, { drawMode: val as any })}
                      className={`rounded border px-1.5 py-1 text-[10px] transition-colors ${
                        (selectedBubble.drawMode ?? "both") === val
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* 색상 피커 */}
                <div className="flex gap-4">
                  {(selectedBubble.drawMode ?? "both") !== "stroke_only" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">채색</span>
                      <input
                        type="color"
                        value={selectedBubble.fillColor ?? "#ffffff"}
                        onChange={e => updateBubble(selectedBubble.id, { fillColor: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer p-0"
                      />
                    </div>
                  )}
                  {(selectedBubble.drawMode ?? "both") !== "fill_only" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">선색</span>
                      <input
                        type="color"
                        value={selectedBubble.strokeColor ?? "#222222"}
                        onChange={e => updateBubble(selectedBubble.id, { strokeColor: e.target.value })}
                        className="w-7 h-7 rounded border cursor-pointer p-0"
                      />
                    </div>
                  )}
                </div>

                {/* 선 두께 슬라이더 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                    선 두께 {selectedBubble.strokeWidth}px
                  </span>
                  <Slider
                    value={[selectedBubble.strokeWidth]}
                    onValueChange={([v]) => updateBubble(selectedBubble.id, { strokeWidth: v })}
                    min={0.5} max={6} step={0.5} className="flex-1"
                  />
                </div>

                {/* 떨림 슬라이더 - wobbly/handwritten/wavy 일 때만 */}
                {["wobbly","handwritten","wavy"].includes(selectedBubble.style) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                      떨림 {selectedBubble.wobble}
                    </span>
                    <Slider
                      value={[selectedBubble.wobble]}
                      onValueChange={([v]) => updateBubble(selectedBubble.id, { wobble: v })}
                      min={0} max={20} step={1} className="flex-1"
                    />
                  </div>
                )}
              </div>

              {/* ── 섹션3: 플래시 / 효과 ── */}
              <div className="py-3 space-y-2 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">⚡ 플래시 / 효과</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["flash_black","flash_normal","flash_dense"] as BubbleStyle[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateBubble(selectedBubble.id, { style: s })}
                      className={`rounded border px-1.5 py-1 text-[10px] text-center transition-colors ${
                        selectedBubble.style === s
                          ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {FLASH_STYLE_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* 플래시 선택됐을 때만 슬라이더 표시 */}
                {selectedBubble.style.startsWith("flash_") && (
                  <div className="space-y-1.5 pt-1">
                    {[
                      { label:"선 간격", key:"flashLineSpacing",   min:0.05, max:1,   step:0.05, def:0.3  },
                      { label:"선 두께", key:"flashLineThickness", min:0.1,  max:4,   step:0.1,  def:0.8  },
                      { label:"선 길이", key:"flashLineLength",    min:5,    max:100, step:1,    def:30   },
                      { label:"선 개수", key:"flashLineCount",     min:8,    max:60,  step:1,    def:24   },
                      { label:"내부크기",key:"flashInnerRadius",   min:0.2,  max:0.9, step:0.05, def:0.65 },
                      ...( selectedBubble.style === "flash_black" ? [
                        { label:"돌기 수",  key:"flashBumpCount",  min:6,  max:60, step:1, def:24 },
                        { label:"돌기 높이",key:"flashBumpHeight", min:1,  max:30, step:1, def:10 },
                      ] : []),
                    ].map(({ label, key, min, max, step, def }) => {
                      const val = (selectedBubble as any)[key] ?? def;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                            {label} {step < 1 ? (val as number).toFixed(2) : val}
                          </span>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => updateBubble(selectedBubble.id, { [key]: v } as any)}
                            min={min} max={max} step={step} className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 섹션4: 말꼬리 종류/방향 ── */}
              <div className="py-3 space-y-2 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">말꼬리</span>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={selectedBubble.tailStyle}
                    onValueChange={(v) => updateBubble(selectedBubble.id, { tailStyle: v as TailStyle })}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TAIL_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedBubble.tailStyle !== "none" && (
                    <Select
                      value={selectedBubble.tailDirection}
                      onValueChange={(v: any) => updateBubble(selectedBubble.id, {
                        tailDirection: v,
                        tailTipX: undefined, tailTipY: undefined,
                        tailCtrl1X: undefined, tailCtrl1Y: undefined,
                        tailCtrl2X: undefined, tailCtrl2Y: undefined,
                      })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom">아래</SelectItem>
                        <SelectItem value="top">위</SelectItem>
                        <SelectItem value="left">왼쪽</SelectItem>
                        <SelectItem value="right">오른쪽</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* ── 섹션5: 말꼬리 세부 조정 (꼬리 있을 때만) ── */}
              {selectedBubble.tailStyle !== "none" && (
                <div className="py-3 space-y-2 px-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">말꼬리 세부 조정</span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    캔버스에서 <b>●</b> 끝점 핸들, <b>◆</b> 곡선 핸들을 드래그해 직접 조작 가능
                  </p>

                  {/* 꼬리 폭 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                      꼬리 폭 {selectedBubble.tailBaseSpread ?? 8}
                    </span>
                    <Slider
                      value={[selectedBubble.tailBaseSpread ?? 8]}
                      onValueChange={([v]) => updateBubble(selectedBubble.id, {
                        tailBaseSpread: v,
                        tailCtrl1X: undefined, tailCtrl1Y: undefined,
                        tailCtrl2X: undefined, tailCtrl2Y: undefined,
                      })}
                      min={4} max={60} step={1} className="flex-1"
                    />
                  </div>

                  {/* 곡률 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                      곡률 {Math.round((selectedBubble.tailCurve ?? 0.5) * 100)}%
                    </span>
                    <Slider
                      value={[selectedBubble.tailCurve ?? 0.5]}
                      onValueChange={([v]) => updateBubble(selectedBubble.id, {
                        tailCurve: v,
                        tailCtrl1X: undefined, tailCtrl1Y: undefined,
                        tailCtrl2X: undefined, tailCtrl2Y: undefined,
                      })}
                      min={0} max={1} step={0.05} className="flex-1"
                    />
                  </div>

                  {/* 흔들림 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                      흔들림 {selectedBubble.tailJitter ?? 0}
                    </span>
                    <Slider
                      value={[selectedBubble.tailJitter ?? 0]}
                      onValueChange={([v]) => updateBubble(selectedBubble.id, {
                        tailJitter: v,
                      })}
                      min={0} max={3} step={0.1} className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : selectedChar ? (
            <div className="space-y-4">
              <h3 className="font-medium">캐릭터 편집</h3>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500"
                onClick={() =>
                  updateActivePage({
                    characters: activePage.characters.filter(
                      (c) => c.id !== selectedCharId,
                    ),
                  })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" /> 삭제
              </Button>
              <Button
                variant={isPro ? "default" : "outline"}
                size="sm"
                className="w-full justify-center gap-1.5"
                onClick={handleRemoveBackground}
                disabled={removingBg || !isPro}
                data-testid="button-remove-bg-bubble"
              >
                {removingBg ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">AI 배경제거 (Pro)</span>
                {!isPro && <Crown className="h-3 w-3 text-yellow-500" />}
              </Button>
            </div>
          ) : null}
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
                  {(selectedBubbleId || selectedCharId) && (
                    <>
                      <ContextMenuItem onClick={copySelectedElement}>복사</ContextMenuItem>
                      <ContextMenuItem onClick={pasteFromClipboard}>붙여넣기</ContextMenuItem>
                      <ContextMenuItem onClick={rotateSelectedElement}>회전</ContextMenuItem>
                      <ContextMenuSeparator />
                      {selectedBubbleId && (
                        <>
                          <ContextMenuItem onClick={groupSelectedBubbleWithAbove}>
                            그룹으로 묶기
                          </ContextMenuItem>
                          <ContextMenuItem onClick={ungroupSelectedBubble}>
                            그룹 해제
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                        </>
                      )}
                      <ContextMenuItem onClick={bringSelectedLayerForward}>레이어 앞으로</ContextMenuItem>
                      <ContextMenuItem onClick={sendSelectedLayerBackward}>레이어 뒤로</ContextMenuItem>
                      <ContextMenuItem onClick={toggleLockSelectedElement}>
                        {selectedCharId
                          ? activePage.characters.find((c) => c.id === selectedCharId)?.locked
                            ? "잠금 해제"
                            : "잠금"
                          : selectedBubbleId
                          ? activePage.bubbles.find((b) => b.id === selectedBubbleId)?.locked
                            ? "잠금 해제"
                            : "잠금"
                          : "잠금"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={deleteSelectedElement} className="text-red-500">
                        삭제
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
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
