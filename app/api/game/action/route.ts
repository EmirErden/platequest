import {
    applyGameAction,
    isGameAction,
    type GameAction,
    type GameActionRejection,
} from "@/lib/game-actions";
import {
    readStoredProgress,
    updateProgressIfUnchanged,
} from "@/lib/game-progress-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isGameMode } from "@/types/game";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Aynı anda başka bir sekme de yazarsa kaç kez yeniden okunup denenecek.
const MAX_ATTEMPTS = 3;

const REJECTION_MESSAGES: Record<GameActionRejection, string> = {
    game_complete: "Oyun zaten tamamlanmış.",
    wrong_phase: "Bu işlem oyunun şu anki aşamasında yapılamaz.",
    no_more_hints: "Bu il için başka ipucu kalmadı.",
    already_completed: "Bu il zaten tamamlanmış.",
    wrong_province: "Sıradaki il bu değil.",
};

type ActionRequest = {
    gameMode: unknown;
    sessionId: unknown;
    action: unknown;
};

// Tek bir oyun eylemini (isim doğru, ipucu, il tıklama) sunucudaki kayda
// uygular. İstemci aynı kuralı ekranı beklemeden kendisi de uygular; burası
// doğruluğun kaynağı. Reddedilirse 409 ile sunucudaki güncel durum döner,
// istemci ona geri döner.
export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return Response.json(
            { error: "Oturum açmanız gerekiyor." },
            { status: 401 }
        );
    }

    const body = await readRequestBody(request);

    if (
        !body ||
        !isGameMode(body.gameMode) ||
        typeof body.sessionId !== "string" ||
        !UUID_PATTERN.test(body.sessionId) ||
        !isGameAction(body.action)
    ) {
        return Response.json(
            { error: "Geçersiz oyun isteği." },
            { status: 400 }
        );
    }

    const admin = createAdminClient();
    const gameMode = body.gameMode;
    const action: GameAction = body.action;

    try {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const stored = await readStoredProgress(admin, user.id, gameMode);

            if (!stored) {
                return Response.json(
                    { error: "Oyun bulunamadı. Sayfayı yenile." },
                    { status: 404 }
                );
            }

            // Oyun başka bir sekmede yeniden başlatılmış olabilir.
            if (stored.progress.sessionId !== body.sessionId) {
                return Response.json(
                    {
                        error: "Bu oyun başka bir yerde yeniden başlatılmış.",
                        progress: stored.progress,
                    },
                    { status: 409 }
                );
            }

            const result = applyGameAction(stored.progress, action);

            if (!result.ok) {
                return Response.json(
                    {
                        error: REJECTION_MESSAGES[result.reason],
                        progress: stored.progress,
                    },
                    { status: 409 }
                );
            }

            const isSaved = await updateProgressIfUnchanged(
                admin,
                user.id,
                gameMode,
                result.progress,
                stored.updatedAt
            );

            if (isSaved) {
                return Response.json({ progress: result.progress });
            }
        }

        // Her denemede başka bir yazma araya girdi.
        const latest = await readStoredProgress(admin, user.id, gameMode);

        return Response.json(
            {
                error: "Oyun aynı anda başka bir yerde güncelleniyor.",
                ...(latest ? { progress: latest.progress } : {}),
            },
            { status: 409 }
        );
    } catch (error) {
        console.error("Oyun eylemi kaydedilemedi:", error);

        return Response.json(
            { error: "İlerleme kaydedilemedi." },
            { status: 500 }
        );
    }
}

async function readRequestBody(
    request: Request
): Promise<ActionRequest | null> {
    try {
        return (await request.json()) as ActionRequest;
    } catch {
        return null;
    }
}
