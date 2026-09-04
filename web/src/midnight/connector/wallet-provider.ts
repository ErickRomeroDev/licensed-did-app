// midnight-js WalletProvider + MidnightProvider over a dApp-connector session: the wallet balances (pays the fee),
// signs and submits; the dApp only ever hands it a proven, unbalanced transaction.
import * as ledger from "@midnight-ntwrk/ledger-v8";
import type { MidnightProvider, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { fromHex, toHex } from "@licensed/shared";
import type { WalletSession } from "./types";

export const connectorWalletProviders = (session: WalletSession): WalletProvider & MidnightProvider => ({
  getCoinPublicKey: () => session.shieldedCoinPublicKey as unknown as ledger.CoinPublicKey,
  getEncryptionPublicKey: () => session.shieldedEncryptionPublicKey as unknown as ledger.EncPublicKey,

  async balanceTx(tx, _ttl) {
    const serialized = toHex(tx.serialize());
    // The second argument must be present: extension messaging layers append a `{sender}` argument after it.
    const balanced = await session.api.balanceUnsealedTransaction(serialized, {});
    return ledger.Transaction.deserialize<ledger.SignatureEnabled, ledger.Proof, ledger.Binding>(
      "signature",
      "proof",
      "binding",
      fromHex(balanced.tx),
    );
  },

  async submitTx(tx) {
    await session.api.submitTransaction(toHex(tx.serialize()));
    const ids = tx.identifiers();
    const id = ids[0];
    if (!id) throw new Error("Submitted transaction has no identifier");
    return id;
  },
});
