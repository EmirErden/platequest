import Game from "@/components/game/Game";
import { requireUser } from "@/lib/auth";

export default async function OrderedPlatePage() {
    const user = await requireUser();

    return (
        <Game
            gameMode="ordered-plate"
            userId={user.id}
            username={user.username}
        />
    );
}
