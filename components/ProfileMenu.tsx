"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";

import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
    username?: string | null;
};

export default function ProfileMenu({ username: initialUsername }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState(initialUsername ?? null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialUsername) {
            return;
        }

        const loadUsername = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .maybeSingle();

            setUsername(profile?.username ?? user.user_metadata.username ?? null);
        };

        void loadUsername();
    }, [initialUsername]);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    const displayName = username ?? "Gezgin";

    return (
        <div className={styles.wrapper} ref={menuRef}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="Profil menüsünü aç"
            >
                <span className={styles.avatar} aria-hidden="true">
                    {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.chevron} aria-hidden="true">⌄</span>
            </button>

            {isOpen && (
                <div className={styles.menu} role="menu">
                    <div className={styles.identity}>
                        <span className={styles.name}>{displayName}</span>
                        <span className={styles.label}>Oyuncu</span>
                    </div>

                    <Link
                        href="/profile"
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        Profilim
                    </Link>

                    <div className={styles.divider} />

                    <LogoutButton
                        className={styles.logoutItem}
                    />
                </div>
            )}
        </div>
    );
}
