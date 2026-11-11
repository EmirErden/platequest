import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import {
    parseTurkeyPlateProgress,
    type TurkeyPlateProgress,
} from "@/lib/game-state";
import { getDatabaseGameMode, type GameMode } from "@/types/game";

// user_game_progress'e yazma yetkisi sadece service role'de (kullanıcı sadece
// okuyabilir). İlerlemeyi yazan tek yer bu dosyadaki fonksiyonlar.

type AdminClient = ReturnType<typeof createAdminClient>;

export type StoredProgress = {
    progress: TurkeyPlateProgress;
    // Eşzamanlı güncellemeleri yakalamak için sürüm işareti gibi kullanılıyor.
    updatedAt: string;
};

export async function readStoredProgress(
    admin: AdminClient,
    userId: string,
    gameMode: GameMode
): Promise<StoredProgress | null> {
    const { data, error } = await admin
        .from("user_game_progress")
        .select("state, updated_at")
        .eq("user_id", userId)
        .eq("game_mode", getDatabaseGameMode(gameMode))
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data
        ? {
              progress: parseTurkeyPlateProgress(data.state, gameMode),
              updatedAt: data.updated_at,
          }
        : null;
}

// Kayıt yoksa oluşturur, varsa üzerine yazar (oyun başlatma / sıfırlama).
export async function saveProgress(
    admin: AdminClient,
    userId: string,
    gameMode: GameMode,
    progress: TurkeyPlateProgress
): Promise<void> {
    const { error } = await admin
        .from("user_game_progress")
        .upsert(
            {
                user_id: userId,
                game_mode: getDatabaseGameMode(gameMode),
                ...toProgressColumns(progress),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,game_mode" }
        );

    if (error) {
        throw error;
    }
}

// Sadece kayıt okunduğundan beri değişmediyse yazar (iyimser kilitleme).
// İki sekme aynı anda eylem gönderirse biri diğerinin yazdığını ezmez;
// false dönerse çağıran yeniden okuyup tekrar dener.
export async function updateProgressIfUnchanged(
    admin: AdminClient,
    userId: string,
    gameMode: GameMode,
    progress: TurkeyPlateProgress,
    expectedUpdatedAt: string
): Promise<boolean> {
    const { data, error } = await admin
        .from("user_game_progress")
        .update({
            ...toProgressColumns(progress),
            updated_at: nextUpdatedAt(expectedUpdatedAt),
        })
        .eq("user_id", userId)
        .eq("game_mode", getDatabaseGameMode(gameMode))
        .eq("updated_at", expectedUpdatedAt)
        .select("updated_at")
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data !== null;
}

function toProgressColumns(progress: TurkeyPlateProgress) {
    return {
        state: progress,
        status: progress.isGameComplete ? "completed" : "in_progress",
    };
}

// Yeni zaman damgası öncekinden kesin büyük olsun: aynı milisaniyede iki yazma
// olursa sürüm işareti değişmemiş görünmesin.
function nextUpdatedAt(previousUpdatedAt: string): string {
    const now = Date.now();
    const previous = Date.parse(previousUpdatedAt);

    return new Date(
        Number.isFinite(previous) && now <= previous ? previous + 1 : now
    ).toISOString();
}
