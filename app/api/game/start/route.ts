import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
    getDatabaseGameMode,
    isGameMode,
    type GameSessionInfo,
} from "@/types/game";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StartRequest = {
    forceNew: unknown;
    gameMode: unknown;
    requestId: unknown;
};

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
    const databaseGameMode = getDatabaseGameMode(body.gameMode);

    if (!body.forceNew) {
        const { data: activeSession, error: activeSessionError } =
            await admin
                .from("game_sessions")
                .select("id, started_at")
                .eq("user_id", user.id)
                .eq("game_mode", databaseGameMode)
                .is("finished_at", null)
                .order("started_at", { ascending: false })
                .limit(1)
                .maybeSingle();

        if (activeSessionError) {
            console.error(
                "Aktif oyun session'ı okunamadı:",
                activeSessionError
            );
            return Response.json(
                { error: "Oyun başlatılamadı." },
                { status: 500 }
            );
        }

        if (activeSession) {
            return Response.json(toSessionInfo(activeSession));
        }
    }

    const startedAt = new Date().toISOString();

    const { data, error } = await admin
        .from("game_sessions")
        .insert({
            id: body.requestId,
            user_id: user.id,
            game_mode: databaseGameMode,
            started_at: startedAt,
            created_at: startedAt,
        })
        .select("id, started_at")
        .single();

    if (!error && data) {
        return Response.json(
            toSessionInfo(data),
            { status: 201 }
        );
    }

    if (error?.code === "23505") {
        const { data: existingSession, error: existingError } =
            await admin
                .from("game_sessions")
                .select("id, user_id, game_mode, started_at")
                .eq("id", body.requestId)
                .maybeSingle();

        if (
            !existingError &&
            existingSession?.user_id === user.id &&
            existingSession.game_mode === databaseGameMode
        ) {
            return Response.json(toSessionInfo(existingSession));
        }
    }

    console.error("Oyun session'ı oluşturulamadı:", error);

    return Response.json(
        { error: "Oyun başlatılamadı." },
        { status: 500 }
    );
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
