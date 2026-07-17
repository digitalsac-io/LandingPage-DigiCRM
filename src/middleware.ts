import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // i18n só nas páginas públicas — nunca em /admin, /api, /uploads, assets
  matcher: ["/((?!api|admin|uploads|_next|healthz|.*\\..*).*)"]
};
