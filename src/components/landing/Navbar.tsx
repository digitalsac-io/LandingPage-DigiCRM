import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteConfig } from "@/lib/config";
import { Button } from "@/components/ui";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SocialLinks } from "./socialIcons";
import { MobileMenu } from "./MobileMenu";

export async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("landing.nav");
  const config = await getSiteConfig();
  const socials = Object.entries(config.social).filter(([, url]) => url);
  const menuLinks = [
    { href: "#features", label: t("features") },
    { href: "#plans", label: t("plans") },
    { href: "#faq", label: t("faq") }
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        {/* esquerda: logo + menu colado nele */}
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {config.logoLight ? (
              <>
                <img src={config.logoLight} alt="logo" width={140} height={36} className="h-9 w-auto dark:hidden" />
                <img src={config.logoDark || config.logoLight} alt="logo" width={140} height={36} className="hidden h-9 w-auto dark:block" />
              </>
            ) : (
              <span className="text-lg font-bold text-brand">DigitalSac</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {menuLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-brand">{l.label}</a>
            ))}
          </nav>
        </div>
        {/* direita: sociais │ idioma+tema │ entrar+criar │ hambúrguer (mobile) */}
        <div className="flex items-center gap-4">
          {socials.length > 0 && (
            <>
              <SocialLinks socials={socials} className="hidden text-zinc-500 lg:flex" />
              <span className="hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 lg:block" aria-hidden="true" />
            </>
          )}
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
          <span className="hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-3">
            {config.appUrl && (
              <a href={config.appUrl} className="hidden text-sm font-medium hover:text-brand sm:block">{t("login")}</a>
            )}
            <Link href="/cadastro"><Button>{t("signup")}</Button></Link>
          </div>
          <MobileMenu links={menuLinks} loginUrl={config.appUrl || undefined} loginLabel={t("login")} />
        </div>
      </div>
    </header>
  );
}
