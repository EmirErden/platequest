import StartScreen from "@/components/home/StartScreen";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    let username: string | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

        username = profile?.username ?? null;
    }

    return (
        <StartScreen
            isAuthenticated={!!user}
            username={username}
        />
    );
}