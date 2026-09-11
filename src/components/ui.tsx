import clsx from "clsx";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border-hairline bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border-hairline bg-surface p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  accentVar,
}: {
  label: string;
  value: string;
  sub?: string;
  accentVar?: string;
}) {
  return (
    <div className="rounded-xl border border-border-hairline bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {accentVar && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: `var(${accentVar})` }}
          />
        )}
        <p className="text-xs font-medium text-text-secondary">{label}</p>
      </div>
      <p className="tabular-nums mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

const THRESHOLDS = { good: 95, warning: 75 };

export function achievementStatus(pct: number): "good" | "warning" | "critical" {
  if (pct >= THRESHOLDS.good) return "good";
  if (pct >= THRESHOLDS.warning) return "warning";
  return "critical";
}

const STATUS_META = {
  good: { icon: CheckCircle2, label: "On track", var: "--status-good" },
  warning: { icon: AlertTriangle, label: "Below plan", var: "--status-warning" },
  critical: { icon: XCircle, label: "At risk", var: "--status-critical" },
} as const;

export function AchievementBadge({ pct }: { pct: number }) {
  const status = achievementStatus(pct);
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color: `var(${meta.var})`,
        background: `color-mix(in oklab, var(${meta.var}) 14%, transparent)`,
      }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {pct}% · {meta.label}
    </span>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-border-hairline">{children}</div>;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border-hairline py-10 text-sm text-text-muted">
      {text}
    </div>
  );
}

/** Truncate a label for chart axes (SVG text has no ellipsis support). */
export function truncateLabel(s: string, max = 18): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
