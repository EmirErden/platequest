import {
    initialTurkeyPlateProgress,
    withGameSession,
} from "@/lib/game-state";
import {
    readStoredProgress,
    saveProgress,
    type StoredProgress,
} from "@/lib/game-progress-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
    getDatabaseGameMode,
    isGameMode,
    type GameMode,
    type GameSessionInfo,
} from "@/types/game";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StartRequest = {
    forceNew: unknown;
    gameMode: unknown;
    requestId: unknown;
};

// Oyunu yükler ya da başlatır; ilerlemenin tek yazarı sunucu.
// - forceNew=false: kayıtlı oyun varsa onu döndürür (sayfa yenileme).
// - forceNew=true:  yeni session + başlangıç durumu (yeniden başlat).
// Rastgele il sırası da burada, sunucuda üretilir.
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
        typeof body.forceNew !== "boolean" ||
        typeof body.requestId !== "string" ||
        !UUID_PATTERN.test(body.requestId)
    ) {
        return Response.json(
            { error: "Geçersiz oyun başlangıç isteği." },
            { status: 400 }
        );
    }

    const admin = createAdminClient();
    const gameMode = body.gameMode;

    try {
        let stored: StoredProgress | null = null;

        if (!body.forceNew) {
            stored = await readStoredProgress(admin, user.id, gameMode);

            if (
                stored &&
                (stored.progress.sessionId || stored.progress.isGameComplete)
            ) {
                return Response.json({ progress: stored.progress });
            }
        }

        const session = await createSession(
            admin,
            user.id,
            gameMode,
            body.requestId
        );

        if (!session) {
            return Response.json(
                { error: "Oyun başlatılamadı." },
                { status: 500 }
            );
        }

        // Session'ı olmayan eski bir kayıt varsa ilerleme korunur, sadece
        // session eklenir; yoksa (ya da forceNew) sıfırdan başlanır.
        const progress = withGameSession(
            stored?.progress ?? initialTurkeyPlateProgress(gameMode),
            session
        );

        await saveProgress(admin, user.id, gameMode, progress);

        return Response.json({ progress }, { status: 201 });
    } catch (error) {
        console.error("Oyun başlatılamadı:", error);

        return Response.json(
            { error: "Oyun başlatılamadı." },
            { status: 500 }
        );
    }
}

// requestId istemcide üretilir; aynı istek tekrar gelirse (ağ hatası sonrası
// yeniden deneme) ikinci bir session açılmaz, mevcut olan döner.
async function createSession(
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
    gameMode: GameMode,
    requestId: string
): Promise<GameSessionInfo | null> {
    const databaseGameMode = getDatabaseGameMode(gameMode);
    const startedAt = new Date().toISOString();

    const { data, error } = await admin
        .from("game_sessions")
        .insert({
            id: requestId,
            user_id: userId,
            game_mode: databaseGameMode,
            started_at: startedAt,
            created_at: startedAt,
        })
        .select("id, started_at")
        .single();

    if (!error && data) {
        return toSessionInfo(data);
    }

    if (error?.code === "23505") {
        const { data: existingSession, error: existingError } = await admin
            .from("game_sessions")
            .select("id, user_id, game_mode, started_at")
            .eq("id", requestId)
            .maybeSingle();

        if (
            !existingError &&
            existingSession?.user_id === userId &&
            existingSession.game_mode === databaseGameMode
        ) {
            return toSessionInfo(existingSession);
        }
    }

    console.error("Oyun session'ı oluşturulamadı:", error);

    return null;
}

async function readRequestBody(request: Request): Promise<StartRequest | null> {
    try {
        return (await request.json()) as StartRequest;
    } catch {
        return null;
    }
}

function toSessionInfo(session: {
    id: string;
    started_at: string;
}): GameSessionInfo {
    return {
        sessionId: session.id,
        startedAt: session.started_at,
    };
}
