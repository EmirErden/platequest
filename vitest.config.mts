import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        // tsconfig'teki "@/*" → proje kökü eşlemesinin aynısı. Vite "@" anahtarını
        // hem "@" hem "@/..." için eşleştirir; "@/" yazılırsa eşleşmez.
        alias: {
            "@": projectRoot,
        },
    },
    test: {
        // Şimdilik sadece saf fonksiyonlar test ediliyor; tarayıcı ortamı gerekmiyor.
        environment: "node",
        include: ["**/*.test.ts"],
        exclude: ["node_modules/**", ".next/**"],
    },
});
