import { describe, expect, it, vi } from "vitest";
import { lookupDocument } from "../documentLookup";

describe("lookupDocument", () => {
  it("CNPJ happy path: calls correct URL and returns company name", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ company: { name: "COMPANY" } }), { status: 200 })
    );

    const result = await lookupDocument("04.252.011/0001-10", "", mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://open.cnpja.com/office/04252011000110",
      expect.any(Object)
    );
    expect(result).toEqual({ name: "COMPANY" });
  });

  it("CPF happy path: calls API with X-API-KEY header and returns name", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { nome: "JOSE" } }), { status: 200 })
    );

    const result = await lookupDocument("529.982.247-25", "mykey", mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://apicpf.com/api/consulta?cpf=52998224725",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-KEY": "mykey" }),
      })
    );
    expect(result).toEqual({ name: "JOSE" });
  });

  it("CPF without key: returns null and does NOT call fetchImpl", async () => {
    const mockFetch = vi.fn();

    const result = await lookupDocument("529.982.247-25", "", mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(0);
    expect(result).toBeNull();
  });

  it("non-ok response (status 500): returns null", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    const result = await lookupDocument("04.252.011/0001-10", "", mockFetch);

    expect(result).toBeNull();
  });

  it("network error (fetch throws): returns null", async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network failure"));

    const result = await lookupDocument("04.252.011/0001-10", "", mockFetch);

    expect(result).toBeNull();
  });

  it("invalid digit length (5 digits): returns null and does NOT call fetchImpl", async () => {
    const mockFetch = vi.fn();

    const result = await lookupDocument("12345", "", mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(0);
    expect(result).toBeNull();
  });
});
