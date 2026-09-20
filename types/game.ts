export const GAME_MODES = [
    "ordered-plate",
    "random-plate",
] as const;

export type GameMode = (typeof GAME_MODES)[number];

const DATABASE_GAME_MODES: Record<GameMode, string> = {
    "ordered-plate": "turkey_ordered_plate",
    "random-plate": "turkey_random_plate",
};

export function isGameMode(value: unknown): value is GameMode {
    return GAME_MODES.some((gameMode) => gameMode === value);
}

export function getDatabaseGameMode(gameMode: GameMode): string {
    return DATABASE_GAME_MODES[gameMode];
}

export type GameSessionInfo = {
    sessionId: string;
    startedAt: string;
};

export type GameResult = {
    sessionId: string;
    playTimeMs: number;
    penaltyTimeMs: number;
    finalTimeMs: number;
    letterHintsUsed: number;
    regionHintsUsed: number;
    neighborHintsUsed: number;
    completedAt: string;
};
