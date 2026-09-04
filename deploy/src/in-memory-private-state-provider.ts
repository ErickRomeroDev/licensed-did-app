// Minimal in-memory PrivateStateProvider for midnight-js 4.0.2 (9 methods). Test-only.
import type { SigningKey } from "@midnight-ntwrk/compact-runtime";
import type { ContractAddress } from "@midnight-ntwrk/ledger-v8";
import type { PrivateStateId, PrivateStateProvider } from "@midnight-ntwrk/midnight-js-types";

export const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> => {
  const record = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  return {
    setContractAddress(_contractAddress: ContractAddress): void {},
    set: async (key, state) => void record.set(key, state),
    get: async (key) => record.get(key) ?? null,
    remove: async (key) => void record.delete(key),
    clear: async () => record.clear(),
    setSigningKey: async (address, key) => void signingKeys.set(address, key),
    getSigningKey: async (address) => signingKeys.get(address) ?? null,
    removeSigningKey: async (address) => void signingKeys.delete(address),
    clearSigningKeys: async () => signingKeys.clear(),
    exportPrivateStates: () => Promise.reject(new Error("exportPrivateStates is not supported by the in-memory provider")),
    importPrivateStates: () => Promise.reject(new Error("importPrivateStates is not supported by the in-memory provider")),
    exportSigningKeys: () => Promise.reject(new Error("exportSigningKeys is not supported by the in-memory provider")),
    importSigningKeys: () => Promise.reject(new Error("importSigningKeys is not supported by the in-memory provider")),
  } as PrivateStateProvider<PSI, PS>;
};
