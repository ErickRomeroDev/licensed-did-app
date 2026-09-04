import { NavLink, Route, Routes } from "react-router";
import { BoardPage } from "@/pages/BoardPage";
import { HomePage } from "@/pages/HomePage";
import { VerifyPage } from "@/pages/VerifyPage";
import { WalletPage } from "@/pages/WalletPage";
import { WalletBar } from "@/components/WalletBar";

const nav = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"}`;

export const App = () => (
  <div className="min-h-screen">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <NavLink to="/" className="mr-2 text-lg font-bold tracking-tight">
          🪪 Licensed
        </NavLink>
        <nav className="flex gap-1">
          <NavLink to="/" end className={nav}>
            Start
          </NavLink>
          <NavLink to="/board" className={nav}>
            Board
          </NavLink>
          <NavLink to="/wallet" className={nav}>
            Practitioner
          </NavLink>
          <NavLink to="/verify" className={nav}>
            Hiring platform
          </NavLink>
        </nav>
        <div className="ml-auto">
          <WalletBar />
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </main>
    <footer className="mx-auto max-w-6xl space-y-1 px-4 py-8 text-xs text-slate-500">
      <p>
        Licensed is a demonstration of private, revocable credentials on did:midnight. Nothing runs outside this browser
        except public Midnight infrastructure and your wallet.
      </p>
      <p>
        Built by Erick Romero —{" "}
        <a
          className="underline hover:text-slate-700"
          href="https://x.com/ErickRomeroEdda"
          target="_blank"
          rel="noreferrer"
        >
          @ErickRomeroEdda
        </a>{" "}
        on X — of{" "}
        <a className="underline hover:text-slate-700" href="https://eddalabs.io" target="_blank" rel="noreferrer">
          EDDA Labs
        </a>
        . Feedback welcome.
      </p>
    </footer>
  </div>
);
