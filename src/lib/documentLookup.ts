export type LookupResult = { name: string } | null;

export async function lookupDocument(
  doc: string,
  cpfApiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<LookupResult> {
  try {
    const digits = doc.replace(/\D/g, "");

    if (digits.length === 14) {
      const res = await fetchImpl(`https://open.cnpja.com/office/${digits}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json?.company?.name == null) return null;
      return { name: json.company.name };
    }

    if (digits.length === 11) {
      if (cpfApiKey === "") return null;
      const res = await fetchImpl(`https://apicpf.com/api/consulta?cpf=${digits}`, {
        headers: { "X-API-KEY": cpfApiKey },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json?.data?.nome == null) return null;
      return { name: json.data.nome };
    }

    return null;
  } catch {
    return null;
  }
}
