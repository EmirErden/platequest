import { describe, expect, it } from "vitest";

import { getDatabaseGameMode, isGameMode } from "@/types/game";

describe("isGameMode", () => {
    it("tanımlı modları kabul eder", () => {
        expect(isGameMode("ordered-plate")).toBe(true);
        expect(isGameMode("random-plate")).toBe(true);
    });

    it.each(["", "ordered", "turkey_ordered_plate", null, 1])(
        "tanımsız değeri reddeder: %s",
        (value) => {
            expect(isGameMode(value)).toBe(false);
        }
    );
});

describe("getDatabaseGameMode", () => {
    it("URL modunu DB adına çevirir", () => {
        expect(getDatabaseGameMode("ordered-plate")).toBe(
            "turkey_ordered_plate"
        );
        expect(getDatabaseGameMode("random-plate")).toBe(
            "turkey_random_plate"
        );
    });
});
