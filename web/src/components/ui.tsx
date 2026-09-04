import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";

export const Copyable = ({ value, label, testId }: { value: string; label?: string; testId?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <textarea
        readOnly
        className="input mono h-20 flex-1 resize-y"
        value={value}
        data-testid={testId}
        aria-label={label ?? "value"}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        className="btn-secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard unavailable */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

export const Qr = ({ value, size = 160 }: { value: string; size?: number }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "L" })
      .then((s) => alive && setSrc(s))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  return src ? <img src={src} width={size} height={size} alt="QR code" className="rounded bg-white p-1" /> : <div className="text-xs text-slate-400">QR too large to render</div>;
};

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="label">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

export const Steps = ({ steps }: { steps: Array<{ label: string; state: "todo" | "running" | "done" | "error"; detail?: string }> }) => (
  <ol className="space-y-1 text-sm">
    {steps.map((s, i) => (
      <li key={i} className="flex items-start gap-2" data-testid={`step-${i}`} data-state={s.state}>
        <span className="w-5 text-center">
          {s.state === "done" ? "✅" : s.state === "running" ? "⏳" : s.state === "error" ? "❌" : "○"}
        </span>
        <span>
          {s.label}
          {s.detail && <span className="mono block text-xs text-slate-500">{s.detail}</span>}
        </span>
      </li>
    ))}
  </ol>
);

export const ErrorBox = ({ error }: { error: string | null }) =>
  error ? (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert" data-testid="error">
      {error}
    </div>
  ) : null;

export const short = (s: string, n = 10): string => (s.length <= 2 * n + 1 ? s : `${s.slice(0, n)}…${s.slice(-n)}`);
