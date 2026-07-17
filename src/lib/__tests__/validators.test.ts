import { describe, expect, it } from "vitest";
import {
  isValidCpf, isValidCnpj, isValidDocument, isValidEmail,
  normalizePhone, isStrongPassword
} from "../validators";

describe("validators", () => {
  it("valida CPF com dígitos verificadores", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
  it("valida CNPJ com dígitos verificadores", () => {
    expect(isValidCnpj("04.252.011/0001-10")).toBe(true);
    expect(isValidCnpj("04252011000111")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });
  it("isValidDocument aceita CPF ou CNPJ", () => {
    expect(isValidDocument("52998224725")).toBe(true);
    expect(isValidDocument("04252011000110")).toBe(true);
    expect(isValidDocument("999")).toBe(false);
  });
  it("valida email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("sem-arroba")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
  it("normaliza telefone (10-15 dígitos)", () => {
    expect(normalizePhone("+55 (62) 99999-8888")).toBe("5562999998888");
    expect(normalizePhone("123")).toBeNull();
  });
  it("senha forte: >=8, letra e número", () => {
    expect(isStrongPassword("abc12345")).toBe(true);
    expect(isStrongPassword("abcdefgh")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
    expect(isStrongPassword("a1")).toBe(false);
  });
});
