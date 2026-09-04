// Copied pattern from midnight-did/packages/api/src/transaction-intents.ts (Apache-2.0):
// manual transaction-intent signing that works around an upstream wallet-sdk 3.0 signing bug.
import * as ledger from "@midnight-ntwrk/ledger-v8";

type IntentContainer = { intents?: Map<number, { serialize(): Uint8Array }> | undefined };

export const signTransactionIntents = (
  tx: IntentContainer,
  signFn: (payload: Uint8Array) => ledger.Signature,
  proofMarker: "proof" | "pre-proof",
): void => {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloned: any = (ledger.Intent as any).deserialize("signature", proofMarker, "pre-binding", intent.serialize());
    const sigData: Uint8Array = cloned.signatureData(segment);
    const signature = signFn(sigData);
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: unknown, i: number) => cloned.fallibleUnshieldedOffer.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: unknown, i: number) => cloned.guaranteedUnshieldedOffer.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
};
