import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";

export async function Cta() {
  const t = await getTranslations("landing.cta");
  return (
    <section className="bg-brand py-20 text-white">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-white/85">{t("subtitle")}</p>
        <Link href="/cadastro" className="mt-8 inline-block">
          <Button className="bg-white px-8 py-3 text-base !text-brand hover:bg-zinc-100">{t("button")}</Button>
        </Link>
      </div>
    </section>
  );
}
