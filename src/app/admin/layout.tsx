import { getSiteConfig } from "@/lib/config";
import { darken } from "@/lib/colors";
import "../globals.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const brandVars = `:root{--brand:${config.primaryColor};--brand-dark:${darken(config.primaryColor, 0.2)};--accent-c:${config.accentColor};}`;
  return (
    <html lang="pt-BR">
      <head><style dangerouslySetInnerHTML={{ __html: brandVars }} /></head>
      <body className="bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">{children}</body>
    </html>
  );
}
