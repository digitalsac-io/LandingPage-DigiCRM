import { getTranslations } from "next-intl/server";
import { Bot, KanbanSquare, MessageSquareText, Phone, Send, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui";

const ITEMS = [
  { icon: MessageSquareText, key: "omnichannel" },
  { icon: Send, key: "campaigns" },
  { icon: Bot, key: "ai" },
  { icon: KanbanSquare, key: "kanban" },
  { icon: CalendarClock, key: "scheduler" },
  { icon: Phone, key: "calls" }
] as const;

export async function Features() {
  const t = await getTranslations("landing.features");
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold md:text-4xl">{t("title")}</h2>
      <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ icon: Icon, key }) => (
          <Card key={key} className="transition hover:-translate-y-1 hover:shadow-md">
            <Icon className="text-brand" size={28} />
            <h3 className="mt-4 font-semibold">{t(`${key}Title`)}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t(`${key}Desc`)}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
