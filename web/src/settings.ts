// User settings (localStorage): target network, optional local proof server, dev wallet toggle.
export type Settings = {
  networkId: string;
  localProofServerUrl: string;
  boardName: string;
};

const KEY = "licensed:settings:v1";

export const isDevWalletBuild = (): boolean => import.meta.env.VITE_DEV_WALLET === "true";

export const defaultSettings = (): Settings => ({
  networkId: isDevWalletBuild() ? "undeployed" : "preprod",
  localProofServerUrl: "",
  boardName: "State Electrical Licensing Board",
});

export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultSettings(), ...(JSON.parse(raw) as Partial<Settings>) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
};

export const saveSettings = (s: Settings): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

export const explorerTxUrl = (networkId: string, txHash: string): string | null =>
  networkId === "undeployed" ? null : `https://explorer.1am.xyz/tx/${txHash}?network=${networkId}`;
