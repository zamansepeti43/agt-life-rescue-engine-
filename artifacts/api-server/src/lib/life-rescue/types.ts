export type RescueCategory =
  | "money"
  | "home"
  | "family"
  | "work"
  | "vehicle"
  | "time"
  | "bills"
  | "travel"
  | "moving"
  | "decision"
  | "other";

export type RescueGoal =
  | "find_money"
  | "reduce_cost"
  | "save_time"
  | "prioritize"
  | "make_decision"
  | "cancel"
  | "organize"
  | "solve";

export type RescueActionType =
  | "reduce"
  | "delay"
  | "cancel"
  | "rearrange"
  | "earn"
  | "do_now"
  | "ask_help"
  | "compare";

export interface RescueInput {
  problem: string;
  category?: RescueCategory;
  goal?: RescueGoal;
  urgency?: number;
  budget?: number;
  availableHours?: number;
}

export interface RescueAction {
  type: RescueActionType;
  title: string;
  reason: string;
  priority: number;
}

export interface RescueResult {
  problem: string;
  category: RescueCategory;
  goal: RescueGoal;
  diagnosis: string;
  priority: "critical" | "high" | "normal";
  actions: RescueAction[];
  nextQuestion: string;
  constraints: string[];
}
