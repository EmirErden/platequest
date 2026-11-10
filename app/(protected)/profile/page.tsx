import Profile from "@/components/profile/Profile";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
    const user = await requireUser();

    return (
        <Profile
            email={user.email}
            username={user.username ?? "Gezgin"}
        />
    );
}
