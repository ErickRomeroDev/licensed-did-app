// In-memory PrivateStateProvider (midnight-js 4.0.2 shape). Long-lived secrets (board keys) are persisted
// separately in IndexedDB by the storage layer and re-supplied as `initialPrivateState` on every join.
import type { SigningKey } from "@midnight-ntwrk/compact-runtime";
import type { ContractAddress } from "@midnight-ntwrk/ledger-v8";
import type { PrivateStateId, PrivateStateProvider } from "@midnight-ntwrk/midnight-js-types";

export const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> => {
  const record = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  const unsupported = (name: string) => () => Promise.reject(new Error(`${name} is not supported by the in-memory provider`));
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
    exportPrivateStates: unsupported("exportPrivateStates"),
    importPrivateStates: unsupported("importPrivateStates"),
    exportSigningKeys: unsupported("exportSigningKeys"),
    importSigningKeys: unsupported("importSigningKeys"),
  } as PrivateStateProvider<PSI, PS>;
};
