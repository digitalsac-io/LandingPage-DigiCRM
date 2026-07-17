import { signFormToken } from "@/lib/security";

let _warnedSecret = false;
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (!_warnedSecret) {
      _warnedSecret = true;
      console.warn("[landing] SESSION_SECRET não definido — usando dev-secret (inseguro)");
    }
    return "dev-secret";
  }
  return s;
}

export async function GET() {
  const token = signFormToken(Date.now(), getSecret());
  return Response.json({ token });
}
