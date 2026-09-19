"use client";

import { provinces } from "@/data/provinces";
import { createClient } from "@/lib/supabase/client";
import type {GameMode} from "@/types/game";

export type TurkeyPlateProgress = {
    version: 1;

    currentIndex: number;
    phase: "name" | "map";

    completedProvinces: string[];
    isGameComplete: boolean;

    hintFreeStreak: number;
    usedHintForCurrentProvince: boolean;

    provinceOrder: number[];
};

export function initialTurkeyPlateProgress(gameMode: GameMode): TurkeyPlateProgress {
    return {
        version: 1,
        currentIndex: 0,
        phase: "name",
        completedProvinces: [],
        isGameComplete: false,
        hintFreeStreak: 0,
        usedHintForCurrentProvince: false,
        provinceOrder: createProvinceOrder(gameMode),
    };
}

export function parseTurkeyPlateProgress(
    value: unknown,
    gameMode: GameMode
): TurkeyPlateProgress {
    if (!value || typeof value !== "object") {
        return initialTurkeyPlateProgress(gameMode);
    }

    const progress = value as Record<string, unknown>;

    if (
        (progress.version !== undefined && progress.version !== 1) ||
        !Number.isInteger(progress.currentIndex) ||
        (progress.currentIndex as number) < 0 ||
        (progress.currentIndex as number) >= provinces.length ||
        typeof progress.isGameComplete !== "boolean" ||
        !Array.isArray(progress.completedProvinces) ||
        !Array.isArray(progress.provinceOrder) ||
        (
            progress.phase !== undefined &&
            progress.phase !== "name" &&
            progress.phase !== "map"
        )
    ) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const currentIndex = progress.currentIndex as number;
    const isGameComplete = progress.isGameComplete as boolean;
    const completedProvinces = progress.completedProvinces as unknown[];
    const provinceOrder = progress.provinceOrder as unknown[];

    const completedCount = isGameComplete
        ? provinces.length
        : currentIndex;

    const hasInvalidCompletedProvinces =
        completedProvinces.length !== completedCount ||
        completedProvinces.some(
            (name, index) =>
                name !== provinces[provinceOrder[index] as number]?.name
        );

    if (
        hasInvalidCompletedProvinces ||
        (isGameComplete && currentIndex !== provinces.length - 1)
    ) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const hasInvalidProvinceOrder =
        provinceOrder.length !== provinces.length ||
        provinceOrder.some(
            (value) =>
                !Number.isInteger(value) ||
                (value as number) < 0 ||
                (value as number) >= provinces.length
        ) ||
        new Set(provinceOrder).size !== provinces.length;


    if (hasInvalidProvinceOrder) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const hasInvalidOrderedProvinceOrder =
        gameMode === "ordered-plate" &&
        provinceOrder.some(
            (provinceIndex, index) => provinceIndex !== index
        );

    if (hasInvalidOrderedProvinceOrder) {
        return initialTurkeyPlateProgress(gameMode);
    }

    return {
        version: 1,
        currentIndex,
        phase:
            progress.phase === "map"
                ? "map"
                : "name",
        completedProvinces: completedProvinces as string[],
        isGameComplete,
        hintFreeStreak:
            Number.isInteger(progress.hintFreeStreak) &&
            (progress.hintFreeStreak as number) >= 0
                ? (progress.hintFreeStreak as number)
                : 0,
        usedHintForCurrentProvince:
            progress.usedHintForCurrentProvince === true,
        provinceOrder: provinceOrder as number[]
    };
}

export async function loadTurkeyPlateProgress(gameMode: GameMode): Promise<TurkeyPlateProgress> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("user_game_progress")
        .select("state")
        .eq("game_mode", getDatabaseGameMode(gameMode))
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        const initialProgress =
            initialTurkeyPlateProgress(gameMode);

        await saveTurkeyPlateProgress(
            initialProgress,
            gameMode
        );

        return initialProgress;
    }

    return parseTurkeyPlateProgress(data.state, gameMode);
}

export async function saveTurkeyPlateProgress(
    progress: TurkeyPlateProgress,
    gameMode: GameMode,
): Promise<void> {
    const supabase = createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error("User is not authenticated.");
    }

    const { error } = await supabase
        .from("user_game_progress")
        .upsert(
            {
                user_id: user.id,
                game_mode: getDatabaseGameMode(gameMode),
                state: progress,
                status: progress.isGameComplete
                    ? "completed"
                    : "in_progress",
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,game_mode",
            }
        );

    if (error) {
        throw error;
    }
}

export async function deleteTurkeyPlateProgress(gameMode: GameMode): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("user_game_progress")
        .delete()
        .eq("game_mode", getDatabaseGameMode(gameMode));

    if (error) {
        throw error;
    }
}

function createProvinceOrder(gameMode: GameMode): number[] {
    const order = provinces.map((_, index) => index);

    if (gameMode === "ordered-plate") {
        return order;
    }

    for (let i = order.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [order[i], order[randomIndex]] = [
            order[randomIndex],
            order[i],
        ];
    }

    return order;
}

function getDatabaseGameMode(gameMode: GameMode): string {
    switch (gameMode) {
        case "ordered-plate":
            return "turkey_ordered_plate";

        case "random-plate":
            return "turkey_random_plate";
    }
}