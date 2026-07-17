import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteConfig } from "@/lib/config";
import { SocialLinks } from "./socialIcons";

export async function Footer() {
  const t = await getTranslations("landing.footer");
  const config = await getSiteConfig();
  const socials = Object.entries(config.social).filter(([, url]) => url);
  const hasTerms = Boolean(config.termsUrl || config.termsHtml);
  return (
    // pb extra + pr-24 no desktop: reserva espaço p/ o botão flutuante do WhatsApp não cobrir os ícones
    <footer className="border-t border-zinc-200 pt-10 pb-24 dark:border-zinc-800 md:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-zinc-500 md:flex-row md:justify-between md:pr-24">
        <span>© {new Date().getFullYear()} — {t("rights")}</span>
        <div className="flex items-center gap-4">
          <SocialLinks socials={socials} />
          {hasTerms && <Link href="/termos" className="hover:text-brand">{t("terms")}</Link>}
        </div>
      </div>
    </footer>
  );
}
