import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./app/App";
import { SessionProvider, WALLETS_CHANGED_EVENT } from "./app/session";
import { isDevWalletBuild, loadSettings } from "./settings";
import "./styles.css";

setNetworkId(loadSettings().networkId);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

if (isDevWalletBuild()) {
  // Dev-only: in-page standalone wallet with the 1AM connector surface. Loaded after first render so a failure here
  // shows up in the console instead of blanking the page. Never part of production bundles.
  import("./dev/dev-wallet")
    .then((dev) => {
      dev.installDevWallet();
      dev.warmDevWallet();
      window.dispatchEvent(new Event(WALLETS_CHANGED_EVENT));
    })
    .catch((e) => console.error("[licensed] dev wallet failed to load", e));
}
