import StartScreen from "@/components/home/StartScreen";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
    const user = await getCurrentUser();

    return (
        <StartScreen
            isAuthenticated={!!user}
            username={user?.username ?? null}
        />
    );
}
