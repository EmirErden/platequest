import Profile from "@/components/Profile";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user!.id)
        .maybeSingle();

    return (
        <Profile
            email={user!.email ?? ""}
            username={profile?.username ?? user!.user_metadata.username ?? "Gezgin"}
        />
    );
}
