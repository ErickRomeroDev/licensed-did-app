// IndexedDB persistence (idb-keyval) with the shared bigint/Uint8Array-aware JSON codec. One store per role.
import { createStore, del, get, set } from "idb-keyval";
import { decodeJson, encodeJson, type BoardState, type HeldLicense, type HolderIdentity } from "@licensed/shared";

const store = createStore("licensed", "state");

const read = async <T>(key: string): Promise<T | null> => {
  const raw = await get<string>(key, store);
  return raw ? decodeJson<T>(raw) : null;
};
const write = async (key: string, value: unknown): Promise<void> => set(key, encodeJson(value), store);
const remove = async (key: string): Promise<void> => del(key, store);

export type VerifierRequestRecord = {
  id: string;
  challenge: Uint8Array;
  requiredCategory: number;
  currentDay: number;
  registryAddress: string;
  createdAt: number;
  verifiedTxHash?: string;
  status: "waiting" | "verified" | "expired";
};

export type VerifierState = { registryAddress: string; verifierName: string; requests: VerifierRequestRecord[] };

export const boardStore = {
  load: () => read<BoardState>("board"),
  save: (b: BoardState) => write("board", b),
  clear: () => remove("board"),
};

export const holderStore = {
  loadIdentity: () => read<HolderIdentity>("holder:identity"),
  saveIdentity: (h: HolderIdentity) => write("holder:identity", h),
  loadLicenses: async () => (await read<HeldLicense[]>("holder:licenses")) ?? [],
  saveLicenses: (l: HeldLicense[]) => write("holder:licenses", l),
  clear: async () => {
    await remove("holder:identity");
    await remove("holder:licenses");
  },
};

export const verifierStore = {
  load: () => read<VerifierState>("verifier"),
  save: (v: VerifierState) => write("verifier", v),
  clear: () => remove("verifier"),
};

/** Same-browser handoff board → practitioner (mirrors what copy/paste does across browsers). */
export const HANDOFF_CHANNEL = "licensed-handoff";
export type HandoffMessage = { type: "license"; wire: string } | { type: "request"; wire: string };
