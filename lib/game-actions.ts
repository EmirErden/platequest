// Oyunun kuralları: bir eylemin (isim doğru, ipucu, il tıklama) oyun durumunu
// nasıl değiştirdiği. Saf modül — aynı fonksiyon tarayıcıda ekranı beklemeden
// güncellemek için, sunucuda (/api/game/action) ise eylemi doğrulayıp kaydetmek
// için çalışır. Kurallar tek yerde olduğu için ikisi birbirinden ayrışmaz.
import { provinces } from "@/data/provinces";
import type { TurkeyPlateProgress } from "@/lib/game-state";

export type GameAction =
    | { type: "correct_name" }
    | { type: "letter_hint" }
    | { type: "map_hint" }
    | { type: "answer"; provinceName: string };

export type GameActionRejection =
    | "game_complete"
    | "wrong_phase"
    | "no_more_hints"
    | "already_completed"
    | "wrong_province";

export type GameActionResult =
    | { ok: true; progress: TurkeyPlateProgress }
    | { ok: false; reason: GameActionRejection };

// İl adından uzun olamaz; DB'ye/isteğe saçma büyüklükte metin girmesin.
const MAX_PROVINCE_NAME_LENGTH = 64;

export function getCurrentProvince(progress: TurkeyPlateProgress) {
    return provinces[progress.provinceOrder[progress.currentIndex]];
}

export function applyGameAction(
    progress: TurkeyPlateProgress,
    action: GameAction
): GameActionResult {
    if (progress.isGameComplete) {
        return reject("game_complete");
    }

    switch (action.type) {
        case "correct_name":
            return applyCorrectName(progress);
        case "letter_hint":
            return applyLetterHint(progress);
        case "map_hint":
            return applyMapHint(progress);
        case "answer":
            return applyAnswer(progress, action.provinceName);
    }
}

// İsim aşamasında doğru ad yazıldı → harita aşamasına geç.
function applyCorrectName(progress: TurkeyPlateProgress): GameActionResult {
    if (progress.phase !== "name") {
        return reject("wrong_phase");
    }

    return accept({ ...progress, phase: "map" });
}

// "Bir harf aç": sadece isim aşamasında, il adının harf sayısı kadar.
function applyLetterHint(progress: TurkeyPlateProgress): GameActionResult {
    if (progress.phase !== "name") {
        return reject("wrong_phase");
    }

    const nameLength = Array.from(getCurrentProvince(progress).name).length;

    if (progress.nameHintCount >= nameLength) {
        return reject("no_more_hints");
    }

    return accept({
        ...progress,
        usedHintForCurrentProvince: true,
        nameHintCount: progress.nameHintCount + 1,
        letterHintsUsed: progress.letterHintsUsed + 1,
    });
}

// "Bölgeyi göster" (1. seviye) → "Komşuları göster" (2. seviye); sadece
// harita aşamasında.
function applyMapHint(progress: TurkeyPlateProgress): GameActionResult {
    if (progress.phase !== "map") {
        return reject("wrong_phase");
    }

    if (progress.mapHintLevel >= 2) {
        return reject("no_more_hints");
    }

    const nextMapHintLevel = progress.mapHintLevel + 1;

    return accept({
        ...progress,
        usedHintForCurrentProvince: true,
        mapHintLevel: nextMapHintLevel,
        regionHintsUsed:
            progress.regionHintsUsed + (nextMapHintLevel === 1 ? 1 : 0),
        neighborHintsUsed:
            progress.neighborHintsUsed + (nextMapHintLevel === 2 ? 1 : 0),
    });
}

// Haritada il tıklandı. İsim aşamasında doğrudan doğru ili tıklamak da kabul.
function applyAnswer(
    progress: TurkeyPlateProgress,
    provinceName: string
): GameActionResult {
    if (progress.completedProvinces.includes(provinceName)) {
        return reject("already_completed");
    }

    if (provinceName !== getCurrentProvince(progress).name) {
        return reject("wrong_province");
    }

    const nextIndex = progress.currentIndex + 1;

    return accept({
        ...progress,
        currentIndex: Math.min(nextIndex, provinces.length - 1),
        phase: "name",
        completedProvinces: [...progress.completedProvinces, provinceName],
        isGameComplete: nextIndex >= provinces.length,
        hintFreeStreak: progress.usedHintForCurrentProvince
            ? 0
            : progress.hintFreeStreak + 1,
        usedHintForCurrentProvince: false,
        nameHintCount: 0,
        mapHintLevel: 0,
    });
}

// API route'u istek gövdesini doğrularken kullanır (gövde `unknown` gelir).
export function isGameAction(value: unknown): value is GameAction {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const action = value as Record<string, unknown>;
    const keyCount = Object.keys(action).length;

    switch (action.type) {
        case "correct_name":
        case "letter_hint":
        case "map_hint":
            return keyCount === 1;
        case "answer":
            return (
                keyCount === 2 &&
                typeof action.provinceName === "string" &&
                action.provinceName.length > 0 &&
                action.provinceName.length <= MAX_PROVINCE_NAME_LENGTH
            );
        default:
            return false;
    }
}

function accept(progress: TurkeyPlateProgress): GameActionResult {
    return { ok: true, progress };
}

function reject(reason: GameActionRejection): GameActionResult {
    return { ok: false, reason };
}
