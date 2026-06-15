/**
 * Cloud gateway contracts. The Supabase adapters implement these; apps depend
 * only on these interfaces (the canonical successor to the desktop
 * data/ports.ts, extended with Auth / Realtime / AI for multi-platform).
 */
import type {
  CompleteTaskResult,
  PurchaseUnlockResult,
  Task,
  TaskDetailInput,
  UnlockProgress,
} from "@warmdock/core";
import type { Session } from "@supabase/supabase-js";
import type { AiAnalysis, Profile, ProfilePatch, Snapshot } from "./types";

export interface TaskGateway {
  listToday(): Promise<Task[]>;
  /** create requires a client-generated UUID (idempotency) and the device IANA timezone. */
  create(title: string, clientRequestId: string, timezone: string): Promise<Task>;
  /** edit a draft task's title (only allowed before difficulty is set). */
  updateTitle(taskId: string, title: string): Promise<Task>;
  /** discard a draft task (cancel before difficulty is set). */
  discard(taskId: string): Promise<void>;
  setDetail(taskId: string, input: TaskDetailInput): Promise<Task>;
  complete(taskId: string): Promise<CompleteTaskResult>;
}

export interface SessionGateway {
  /** Authoritative snapshot on startup/foreground (polling is retired). */
  bootstrap(): Promise<Snapshot>;
}

export interface UnlockGateway {
  progress(): Promise<UnlockProgress>;
  purchase(nodeId: string): Promise<PurchaseUnlockResult>;
}

export interface SettingsGateway {
  /** Non-authoritative preferences via RLS-protected direct update. */
  updatePreferences(patch: ProfilePatch): Promise<Profile>;
}

export interface AuthGateway {
  getSession(): Promise<Session | null>;
  /** Returns an unsubscribe function. */
  onAuthStateChange(cb: (session: Session | null) => void): () => void;
  signInWithGoogle(redirectTo?: string): Promise<void>;
  signInWithEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, token: string): Promise<Session>;
  signOut(): Promise<void>;
  /** Enter the 30-day deletion grace period and sign out all devices. */
  requestAccountDeletion(): Promise<void>;
  /** Recover an account that is still within its grace period. */
  recoverAccount(): Promise<void>;
}

export type RealtimeEvent = "task" | "wallet" | "cycle" | "profile";

export interface RealtimeHandlers {
  /** Fired when an authoritative row for this user changes (another device, cron, etc.). */
  onChange: (event: RealtimeEvent) => void;
  /** Fired when the realtime socket connects/disconnects (drives offline detection). */
  onConnectionChange?: (connected: boolean) => void;
}

export interface RealtimeGateway {
  /** Subscribe to authoritative changes for a user. Returns an unsubscribe function. */
  subscribe(userId: string, handlers: RealtimeHandlers): () => void;
}

export interface AiGateway {
  /** Analyze a proposed task. Never throws on AI failure — returns a medium/3 fallback. */
  analyzeTaskProposal(title: string): Promise<AiAnalysis>;
}

export interface Gateways {
  task: TaskGateway;
  session: SessionGateway;
  unlock: UnlockGateway;
  settings: SettingsGateway;
  auth: AuthGateway;
  realtime: RealtimeGateway;
  ai: AiGateway;
}
