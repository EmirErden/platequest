"use client";

import type { GameAction } from "@/lib/game-actions";
import {
    parseTurkeyPlateProgress,
    type TurkeyPlateProgress,
} from "@/lib/game-state";
import type { GameMode, GameResult } from "@/types/game";

// Tarayıcının oyun API'leriyle konuştuğu tek yer. Yanıtlar `unknown` kabul
// edilip doğrulanır.

export type GameActionResponse =
    | { accepted: true }
    // Sunucu eylemi reddetti; istemci bu duruma geri dönmeli.
    | { accepted: false; error: string; progress: TurkeyPlateProgress };

// Kayıtlı oyunu yükler, yoksa (ya da forceNew ile) yenisini başlatır.
export async function startGameSession(
    gameMode: GameMode,
    forceNew = false
): Promise<TurkeyPlateProgress> {
    const response = await fetch("/api/game/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            forceNew,
            gameMode,
            requestId: crypto.randomUUID(),
        }),
    });

    const body: unknown = await response.json();

    if (!response.ok) {
        throw new Error(readError(body, "Oyun başlatılamadı."));
    }

    const progress = readProgress(body, gameMode);

    if (!progress) {
        throw new Error("Sunucu geçersiz bir oyun durumu döndürdü.");
    }

    return progress;
}

export async function sendGameAction(
    gameMode: GameMode,
    sessionId: string,
    action: GameAction
): Promise<GameActionResponse> {
    const response = await fetch("/api/game/action", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gameMode,
            sessionId,
            action,
        }),
    });

    const body: unknown = await response.json();

    if (response.ok) {
        return { accepted: true };
    }

    const serverProgress =
        response.status === 409 ? readProgress(body, gameMode) : null;

    if (serverProgress) {
        return {
            accepted: false,
            error: readError(body, "İşlem kabul edilmedi."),
            progress: serverProgress,
        };
    }

    throw new Error(readError(body, "İlerleme kaydedilemedi."));
}

export async function finishGameSession(
    gameMode: GameMode,
    sessionId: string
): Promise<GameResult> {
    const response = await fetch("/api/game/finish", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gameMode,
            sessionId,
        }),
    });

    const body: unknown = await response.json();

    if (!response.ok) {
        throw new Error(readError(body, "Oyun sonucu kaydedilemedi."));
    }

    if (!isGameResult(body)) {
        throw new Error("Sunucu geçersiz bir oyun sonucu döndürdü.");
    }

    return body;
}

// `{ progress: {...} }` gövdesinden oyun durumunu okur.
function readProgress(
    value: unknown,
    gameMode: GameMode
): TurkeyPlateProgress | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const progress = (value as Record<string, unknown>).progress;

    if (!progress || typeof progress !== "object") {
        return null;
    }

    return parseTurkeyPlateProgress(progress, gameMode);
}

function isGameResult(value: unknown): value is GameResult {
    if (!value || typeof value !== "object") {
        return false;
    }

    const result = value as Record<string, unknown>;

    return (
        typeof result.sessionId === "string" &&
        isNonNegativeInteger(result.playTimeMs) &&
        isNonNegativeInteger(result.penaltyTimeMs) &&
        isNonNegativeInteger(result.finalTimeMs) &&
        isNonNegativeInteger(result.letterHintsUsed) &&
        isNonNegativeInteger(result.regionHintsUsed) &&
        isNonNegativeInteger(result.neighborHintsUsed) &&
        typeof result.completedAt === "string"
    );
}

function isNonNegativeInteger(value: unknown): boolean {
    return Number.isSafeInteger(value) && (value as number) >= 0;
}

function readError(value: unknown, fallback: string): string {
    if (!value || typeof value !== "object") {
        return fallback;
    }

    const error = (value as Record<string, unknown>).error;

    return typeof error === "string" ? error : fallback;
}
