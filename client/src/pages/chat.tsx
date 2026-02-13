import { useState, useRef, useCallback } from "react";
import { useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Send, Trash2, RotateCcw, Lock, ArrowRight, User } from "lucide-react";
import html2canvas from "html2canvas";
import type { Character } from "@shared/schema";

interface ChatMessage {
  id: number;
  sender: "me" | "other";
  text: string;
}

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const characterIdParam = params.get("characterId");
  const characterId = characterIdParam ? parseInt(characterIdParam) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherInput, setOtherInput] = useState("");
  const [meInput, setMeInput] = useState("");
  const [otherName, setOtherName] = useState("친구");
  const [avatarMode, setAvatarMode] = useState<"none" | "character">(characterId ? "character" : "none");
  const [selectedCharId, setSelectedCharId] = useState<number | null>(characterId);
  const [isDownloading, setIsDownloading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  let nextId = useRef(0);

  const { data: credits } = useQuery<{ credits: number; tier: string }>({
    queryKey: ["/api/usage"],
    enabled: isAuthenticated,
  });

  const { data: characters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: isAuthenticated,
  });

  const selectedCharacter = characters?.find((c: Character) => c.id === selectedCharId);

  const isPro = credits?.tier === "pro";

  const addMessage = useCallback((sender: "me" | "other", text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: nextId.current++, sender, text: text.trim() }]);
  }, []);

  const handleOtherSend = () => {
    addMessage("other", otherInput);
    setOtherInput("");
  };

  const handleMeSend = () => {
    addMessage("me", meInput);
    setMeInput("");
  };

  const removeMessage = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const downloadImage = async () => {
    if (!chatRef.current || messages.length === 0) {
      toast({ title: "메시지 없음", description: "채팅 이미지를 만들려면 먼저 메시지를 추가하세요.", variant: "destructive" });
      return;
    }
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(chatRef.current, {
        backgroundColor: "#B2C7D9",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `kakaotalk-chat-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "다운로드 완료!", description: "채팅 이미지가 저장되었습니다." });
    } catch (err) {
      toast({ title: "다운로드 실패", description: "채팅 이미지를 생성할 수 없습니다.", variant: "destructive" });
    }
    setIsDownloading(false);
  };

  if (!isPro && isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(262_83%_58%/0.1)] mx-auto mb-6">
          <Lock className="h-10 w-10 text-[hsl(262_83%_58%)]" />
        </div>
        <h2 className="text-2xl font-bold mb-3" data-testid="text-pro-required-chat">Pro 멤버십 전용</h2>
        <p className="text-muted-foreground mb-6">
          채팅 이미지 메이커는 Pro 멤버십 전용 기능입니다.
          업그레이드하면 내 캐릭터로 카카오톡 스타일 채팅 이미지를 만들 수 있어요.
        </p>
        <Link href="/pricing">
          <Button className="gap-2" data-testid="button-upgrade-chat">
            Pro 업그레이드
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold tracking-tight">채팅 이미지 메이커</h1>
        <p className="mt-2 text-muted-foreground">카카오톡 스타일 채팅 이미지를 만들어보세요</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">대화 상대 이름</Label>
                <Input
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="Friend"
                  data-testid="input-other-name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">프로필 이미지</Label>
                <Select
                  value={avatarMode === "character" && selectedCharId ? String(selectedCharId) : "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setAvatarMode("none");
                      setSelectedCharId(null);
                    } else {
                      setAvatarMode("character");
                      setSelectedCharId(parseInt(v));
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-avatar">
                    <SelectValue placeholder="No avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">아바타 없음 (기본)</SelectItem>
                    {characters?.map((c: Character) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.prompt?.slice(0, 20) || `캐릭터 #${c.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block text-blue-600 dark:text-blue-400">{otherName} (상대방)</Label>
                <div className="flex gap-2">
                  <Input
                    value={otherInput}
                    onChange={(e) => setOtherInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleOtherSend(); } }}
                    placeholder="메시지를 입력하세요..."
                    data-testid="input-other-message"
                  />
                  <Button type="button" size="icon" onClick={handleOtherSend} disabled={!otherInput.trim()} data-testid="button-send-other">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block text-amber-600 dark:text-amber-400">나</Label>
                <div className="flex gap-2">
                  <Input
                    value={meInput}
                    onChange={(e) => setMeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleMeSend(); } }}
                    placeholder="메시지를 입력하세요..."
                    data-testid="input-me-message"
                  />
                  <Button type="button" size="icon" onClick={handleMeSend} disabled={!meInput.trim()} data-testid="button-send-me">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {messages.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">메시지 ({messages.length})</Label>
                <Button variant="ghost" size="sm" onClick={clearMessages} className="gap-1 text-destructive" data-testid="button-clear-messages">
                  <RotateCcw className="h-3.5 w-3.5" />
                  전체 삭제
                </Button>
              </div>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-center gap-2 text-sm py-1 px-2 rounded ${msg.sender === "me" ? "bg-amber-50 dark:bg-amber-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}>
                    <span className={`text-xs font-medium ${msg.sender === "me" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>
                      {msg.sender === "me" ? "나" : otherName}
                    </span>
                    <span className="flex-1 truncate">{msg.text}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeMessage(msg.id)} data-testid={`button-remove-msg-${msg.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={downloadImage}
              disabled={messages.length === 0 || isDownloading}
              data-testid="button-download-chat"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "생성 중..." : "채팅 이미지 다운로드"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Label className="text-sm font-medium">미리보기</Label>
          <div className="overflow-hidden rounded-md border">
            <div
              ref={chatRef}
              style={{
                backgroundColor: "#B2C7D9",
                padding: "0",
                fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
                width: "100%",
                minHeight: "500px",
              }}
            >
              <div style={{
                backgroundColor: "#92A8BA",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>{otherName}</span>
              </div>

              <div style={{ padding: "12px 12px 20px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#7B8D9E", fontSize: "13px" }}>
                    메시지를 추가하면 미리보기가 표시됩니다
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const showProfile = msg.sender === "other" && (idx === 0 || messages[idx - 1].sender !== "other");
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: msg.sender === "me" ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        gap: "6px",
                        marginLeft: msg.sender === "other" && !showProfile ? "42px" : "0",
                      }}
                    >
                      {msg.sender === "other" && showProfile && (
                        <div style={{ width: "36px", height: "36px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                          {avatarMode === "character" && selectedCharacter?.imageUrl ? (
                            <img
                              src={selectedCharacter.imageUrl}
                              alt="character"
                              style={{ width: "36px", height: "36px", objectFit: "cover" }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div style={{ width: 36, height: 36, backgroundColor: "#A0B4C8", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
                        {msg.sender === "other" && showProfile && (
                          <span style={{ fontSize: "11px", color: "#555", marginBottom: "3px", marginLeft: "2px" }}>
                            {otherName}
                          </span>
                        )}
                        <div
                          style={{
                            backgroundColor: msg.sender === "me" ? "#FEE500" : "#FFFFFF",
                            borderRadius: msg.sender === "me" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                            padding: "8px 12px",
                            fontSize: "14px",
                            lineHeight: "1.4",
                            color: "#333",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
