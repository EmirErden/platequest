import Game from "@/components/game/Game";
import { requireUser } from "@/lib/auth";

export default async function RandomPlatePage() {
    const user = await requireUser();

    return (
        <Game
            gameMode="random-plate"
            userId={user.id}
            username={user.username}
        />
    );
}
