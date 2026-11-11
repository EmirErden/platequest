import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/lib/auth-errors";

describe("getAuthErrorMessage", () => {
    it("bilinen kodu Türkçe mesaja çevirir", () => {
        expect(getAuthErrorMessage("invalid_credentials")).toBe(
            "E-posta veya şifre hatalı."
        );
        expect(getAuthErrorMessage("same_password")).toBe(
            "Yeni şifren eski şifrenle aynı olamaz."
        );
    });

    it("bilinmeyen kodda verilen yedek mesajı döner", () => {
        expect(
            getAuthErrorMessage("some_new_code", "Giriş yapılamadı.")
        ).toBe("Giriş yapılamadı.");
    });

    it("kod yoksa varsayılan mesajı döner", () => {
        expect(getAuthErrorMessage(undefined)).toBe(
            "Bir hata oluştu. Lütfen tekrar dene."
        );
    });

    it("Object.prototype anahtarlarını mesaj sanmaz", () => {
        expect(getAuthErrorMessage("toString", "yedek")).toBe("yedek");
    });
});
