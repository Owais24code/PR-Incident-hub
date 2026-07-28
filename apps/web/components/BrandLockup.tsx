import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="public-brand" href="/" aria-label="Security PR Copilot home">
      <span className="public-brand-mark">
        <ShieldCheck size={18} aria-hidden />
      </span>
      <span>
        Security PR Copilot
        {!compact ? <small>Developer security operations</small> : null}
      </span>
    </Link>
  );
}
