import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export async function Faq({ locale }: { locale: string }) {
  const t = await getTranslations("landing.faq");
  const dbItems = await prisma.faqItem.findMany({ where: { locale }, orderBy: { order: "asc" } });
  const items = dbItems.length > 0
    ? dbItems.map(i => ({ q: i.question, a: i.answer }))
    : [1, 2, 3].map(n => ({ q: t(`q${n}` as never), a: t(`a${n}` as never) }));
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold md:text-4xl">{t("title")}</h2>
      <div className="mt-10 space-y-3">
        {items.map(item => (
          <details key={item.q} className="group rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <summary className="cursor-pointer list-none font-medium marker:hidden">{item.q}</summary>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
