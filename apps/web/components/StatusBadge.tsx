const statusStyles: Record<string, string> = {
  received: "badge neutral",
  enriched: "badge info",
  summarized: "badge warn",
  approved: "badge good",
  ticketed: "badge done",
  closed: "badge neutral",
  critical: "badge critical",
  high: "badge high",
  medium: "badge warn",
  low: "badge good",
  unknown: "badge neutral"
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={statusStyles[value] ?? "badge neutral"}>{value}</span>;
}

