const FLOW_KEY = "charagen_flow";

export interface FlowState {
  active: boolean;
  selectedCharacterIds: number[];
  lastPoseImageUrl?: string;
  returnToStory?: boolean;
  storyPanelIndex?: number;
}

export const FLOW_STEPS = [
  { step: 1, label: "캐릭터 준비", path: "/create", key: "create" },
  { step: 2, label: "포즈/표정", path: "/pose", key: "pose" },
  { step: 3, label: "배경/아이템", path: "/background", key: "background" },
  { step: 4, label: "효과", path: "/effects", key: "effects" },
  { step: 5, label: "스토리 편집", path: "/story", key: "story" },
] as const;

export function getFlowState(): FlowState {
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { active: false, selectedCharacterIds: [] };
}

export function setFlowState(state: Partial<FlowState>) {
  const current = getFlowState();
  const next = { ...current, ...state, active: true };
  localStorage.setItem(FLOW_KEY, JSON.stringify(next));
  return next;
}

export function clearFlowState() {
  localStorage.removeItem(FLOW_KEY);
}

export function getStepByPath(path: string): number {
  const found = FLOW_STEPS.find((s) => path.startsWith(s.path));
  return found ? found.step : 0;
}
