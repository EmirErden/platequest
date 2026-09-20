import {
    calculatePenaltyTimeMs,
    isValidHintUsage,
    type HintUsage,
} from "@/lib/game-timing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
    getDatabaseGameMode,
    isGameMode,
    type GameResult,
} from "@/types/game";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESULT_COLUMNS =
    "session_id, play_time_ms, penalty_time_ms, final_time_ms, letter_hints_used, region_hints_used, neighbor_hints_used, completed_at";

type FinishRequest = HintUsage & {
    gameMode: unknown;
    sessionId: unknown;
};

type SessionRow = {
    id: string;
    user_id: string;
    game_mode: string;
    started_at: string;
    finished_at: string | null;
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
        typeof body.sessionId !== "string" ||
        !UUID_PATTERN.test(body.sessionId) ||
        !isValidHintUsage(body)
    ) {
        return Response.json(
            { error: "Geçersiz oyun bitirme isteği." },
            { status: 400 }
        );
    }

    const admin = createAdminClient();
    const databaseGameMode = getDatabaseGameMode(body.gameMode);
    const { data: session, error: sessionError } = await admin
        .from("game_sessions")
        .select("id, user_id, game_mode, started_at, finished_at")
        .eq("id", body.sessionId)
        .maybeSingle<SessionRow>();

    if (sessionError) {
        console.error("Oyun session'ı okunamadı:", sessionError);
        return Response.json(
            { error: "Oyun sonucu kaydedilemedi." },
            { status: 500 }
        );
    }

    if (!session || session.user_id !== user.id) {
        return Response.json(
            { error: "Oyun session'ı bulunamadı." },
            { status: 404 }
        );
    }

    if (session.game_mode !== databaseGameMode) {
        return Response.json(
            { error: "Oyun modu session ile eşleşmiyor." },
            { status: 409 }
        );
    }

    const existingResult = await findResult(admin, session.id);

    if (existingResult) {
        return Response.json(existingResult);
    }

    const finishedSession = await finishSession(admin, session);

    if (!finishedSession) {
        return Response.json(
            { error: "Oyun sonucu kaydedilemedi." },
            { status: 500 }
        );
    }

    const startedAtMs = Date.parse(finishedSession.started_at);
    const finishedAtMs = Date.parse(finishedSession.finished_at ?? "");

    if (!Number.isFinite(startedAtMs) || !Number.isFinite(finishedAtMs)) {
        return Response.json(
            { error: "Oyun session zamanları geçersiz." },
            { status: 500 }
        );
    }

    const playTimeMs = Math.max(0, finishedAtMs - startedAtMs);
    const penaltyTimeMs = calculatePenaltyTimeMs(body);

    const { data: insertedResult, error: insertError } = await admin
        .from("game_results")
        .insert({
            session_id: session.id,
            user_id: user.id,
            game_mode: databaseGameMode,
            play_time_ms: playTimeMs,
            penalty_time_ms: penaltyTimeMs,
            letter_hints_used: body.letterHintsUsed,
            region_hints_used: body.regionHintsUsed,
            neighbor_hints_used: body.neighborHintsUsed,
            completed_at: finishedSession.finished_at,
        })
        .select(RESULT_COLUMNS)
        .single();

    if (!insertError && insertedResult) {
        return Response.json(
            toGameResult(insertedResult),
            { status: 201 }
        );
    }

    if (insertError?.code === "23505") {
        const concurrentResult = await findResult(admin, session.id);

        if (concurrentResult) {
            return Response.json(concurrentResult);
        }
    }

    console.error("Oyun sonucu oluşturulamadı:", insertError);

    return Response.json(
        { error: "Oyun sonucu kaydedilemedi." },
        { status: 500 }
    );
}

async function finishSession(
    admin: ReturnType<typeof createAdminClient>,
    session: SessionRow
): Promise<SessionRow | null> {
    if (session.finished_at) {
        return session;
    }

    const finishedAt = new Date().toISOString();
    const { data, error } = await admin
        .from("game_sessions")
        .update({ finished_at: finishedAt })
        .eq("id", session.id)
        .eq("user_id", session.user_id)
        .is("finished_at", null)
        .select("id, user_id, game_mode, started_at, finished_at")
        .maybeSingle<SessionRow>();

    if (error) {
        console.error("Oyun session'ı tamamlanamadı:", error);
        return null;
    }

    if (data) {
        return data;
    }

    const { data: concurrentlyFinished, error: readError } = await admin
        .from("game_sessions")
        .select("id, user_id, game_mode, started_at, finished_at")
        .eq("id", session.id)
        .eq("user_id", session.user_id)
        .maybeSingle<SessionRow>();

    if (readError) {
        console.error("Tamamlanan oyun session'ı okunamadı:", readError);
        return null;
    }

    return concurrentlyFinished;
}

async function findResult(
    admin: ReturnType<typeof createAdminClient>,
    sessionId: string
): Promise<GameResult | null> {
    const { data, error } = await admin
        .from("game_results")
        .select(RESULT_COLUMNS)
        .eq("session_id", sessionId)
        .maybeSingle();

    if (error) {
        console.error("Mevcut oyun sonucu okunamadı:", error);
        return null;
    }

    return data ? toGameResult(data) : null;
}

async function readRequestBody(request: Request): Promise<FinishRequest | null> {
    try {
        return (await request.json()) as FinishRequest;
    } catch {
        return null;
    }
}

function toGameResult(result: Record<string, unknown>): GameResult {
    return {
        sessionId: readString(result.session_id),
        playTimeMs: readNonNegativeInteger(result.play_time_ms),
        penaltyTimeMs: readNonNegativeInteger(result.penalty_time_ms),
        finalTimeMs: readNonNegativeInteger(result.final_time_ms),
        letterHintsUsed: readNonNegativeInteger(result.letter_hints_used),
        regionHintsUsed: readNonNegativeInteger(result.region_hints_used),
        neighborHintsUsed: readNonNegativeInteger(result.neighbor_hints_used),
        completedAt: readString(result.completed_at),
    };
}

function readString(value: unknown): string {
    if (typeof value !== "string") {
        throw new Error("Supabase returned an invalid string value.");
    }

    return value;
}

function readNonNegativeInteger(value: unknown): number {
    const numberValue =
        typeof value === "string" ? Number(value) : value;

    if (
        typeof numberValue !== "number" ||
        !Number.isSafeInteger(numberValue) ||
        numberValue < 0
    ) {
        throw new Error("Supabase returned an invalid duration value.");
    }

    return numberValue;
}
