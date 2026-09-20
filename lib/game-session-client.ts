"use client";

import type {
    GameMode,
    GameResult,
    GameSessionInfo,
} from "@/types/game";
import type { HintUsage } from "@/lib/game-timing";

export async function startGameSession(
    gameMode: GameMode,
    forceNew = false
): Promise<GameSessionInfo> {
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

    if (!isGameSessionInfo(body)) {
        throw new Error("Sunucu geçersiz bir oyun session'ı döndürdü.");
    }

    return body;
}

export async function finishGameSession(
    gameMode: GameMode,
    sessionId: string,
    hints: HintUsage
): Promise<GameResult> {
    const response = await fetch("/api/game/finish", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gameMode,
            sessionId,
            ...hints,
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

function isGameSessionInfo(value: unknown): value is GameSessionInfo {
    if (!value || typeof value !== "object") {
        return false;
    }

    const session = value as Record<string, unknown>;

    return (
        typeof session.sessionId === "string" &&
        typeof session.startedAt === "string" &&
        Number.isFinite(Date.parse(session.startedAt))
    );
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
