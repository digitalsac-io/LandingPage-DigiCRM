import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import { getSiteConfig } from "@/lib/config";
import { cn } from "@/lib/cn";

export async function Hero() {
  const t = await getTranslations("landing.hero");
  const config = await getSiteConfig();
  const hasBg = Boolean(config.heroImage);
  return (
    <section className="relative overflow-hidden">
      {hasBg ? (
        <>
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.heroImage})` }}
          />
          {/* véu escuro: garante contraste do texto sobre foto clara ou escura */}
          <div className="absolute inset-0 -z-10 bg-black/55" />
        </>
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
      )}
      <div className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
        <h1 className={cn(
          "mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl",
          hasBg && "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        )}>
          {t("title")}
        </h1>
        <p className={cn(
          "mx-auto mt-6 max-w-2xl text-lg",
          hasBg ? "text-zinc-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]" : "text-zinc-600 dark:text-zinc-400"
        )}>
          {t("subtitle")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/cadastro"><Button className="px-8 py-3 text-base">{t("cta")}</Button></Link>
          <a href="#plans">
            <Button variant="outline" className={cn(
              "px-8 py-3 text-base",
              hasBg && "border-white/70 text-white hover:border-white hover:text-white"
            )}>
              {t("ctaSecondary")}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
