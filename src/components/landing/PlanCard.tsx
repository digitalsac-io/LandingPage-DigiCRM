import { Link } from "@/i18n/navigation";
import { Check } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PlanCardData = {
  id: string; name: string; priceLabel: string; approxLabel?: string; recurrenceLabel: string;
  trialLabel?: string; featured: boolean; lines: string[]; moduleLabels: string[];
};

export function PlanCard({ plan, href, t, selectable = false, compact = false }: {
  plan: PlanCardData; href: string;
  t: { modulesIncluded: string; select: string; featured: string };
  selectable?: boolean;
  compact?: boolean;
}) {
  return (
    <Card className={cn("relative flex flex-col", plan.featured && "border-brand ring-2 ring-brand/30", compact && "p-4")}>
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
          {t.featured}
        </span>
      )}
      {plan.trialLabel && (
        <span className="absolute right-4 top-4 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
          {plan.trialLabel}
        </span>
      )}
      <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>{plan.name}</h3>
      <div className="mt-4">
        <span className={cn("font-extrabold", compact ? "text-2xl" : "text-4xl")}>{plan.priceLabel}</span>
        <span className="text-sm text-zinc-500">{plan.recurrenceLabel}</span>
        {plan.approxLabel && <div className="text-xs text-zinc-500">{plan.approxLabel}</div>}
      </div>
      <ul className={cn("mt-6 space-y-2", compact ? "text-xs" : "text-sm")}>
        {plan.lines.map(line => (
          <li key={line} className="flex items-center gap-2"><Check size={16} className="text-brand" />{line}</li>
        ))}
      </ul>
      {plan.moduleLabels.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase text-zinc-500">{t.modulesIncluded}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plan.moduleLabels.map(m => (
              <span key={m} className={cn("rounded-full bg-brand/10 font-medium text-brand", compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs")}>{m}</span>
            ))}
          </div>
        </div>
      )}
      {!selectable && (
        <Link href={href} className="mt-6"><Button className={cn("w-full", compact && "py-2 text-xs")}>{t.select}</Button></Link>
      )}
    </Card>
  );
}
