import type { ConnectedAPI, Configuration, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";

export type { ConnectedAPI, Configuration, InitialAPI };

/** A connected wallet session: everything the providers need, resolved once at connect time. */
export type WalletSession = {
  walletName: string;
  rdns: string;
  networkId: string;
  api: ConnectedAPI;
  configuration: Configuration;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
  unshieldedAddress: string;
};

export const PREFERRED_WALLET_RDNS = ["1am", "xyz.1am", "1AM"];
export const DEV_WALLET_KEY = "dev-standalone";
