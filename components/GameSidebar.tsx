import {provinces} from "@/data/provinces";
import styles from "./GameSidebar.module.css";
import {useState} from "react";
import Link from "next/link";
import ResetGameDialog from "@/components/ResetGameDialog";

type GameSidebarProps = {
    completedProvinces: string[];
    isOpen: boolean;
    onClose: () => void;
    onReset: () => void;
    onProvinceHover: (province: string | null) => void;
};

export default function GameSidebar({
                                        completedProvinces,
                                        isOpen,
                                        onClose,
                                        onReset,
                                        onProvinceHover,
                                    }: GameSidebarProps) {
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    const completedProvinceList = provinces.filter((province) =>
        completedProvinces.includes(province.name)
    );

    return (
        <>
            <aside
                className={`${styles.drawer} ${
                    isOpen ? styles.drawerOpen : ""
                }`}
            >
                <div className={styles.header}>
                    <div>
                        <h2>İlerlemen</h2>
                    </div>

                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    <h3>Tamamlanan İller</h3>

                    <div className={styles.list}>
                        {completedProvinceList.length === 0 ? (
                            <p className={styles.empty}>
                                Henüz tamamlanan il yok.
                            </p>
                        ) : (
                            completedProvinceList.map((province) => (
                                <div
                                    className={styles.province}
                                    key={province.name}
                                    onMouseEnter={() => onProvinceHover(province.name)}
                                    onMouseLeave={() => onProvinceHover(null)}
                                >
                                <span className={styles.plate}>
                                    {province.plate
                                        .toString()
                                        .padStart(2, "0")}
                                </span>

                                    <span className={styles.provinceName}>
                                    {province.name}
                                </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <Link href="/" className={styles.homeLink} onClick={onClose}>
                        ← Ana sayfaya dön
                    </Link>

                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => setIsResetDialogOpen(true)}
                    >
                        İlerlemeyi Sıfırla
                    </button>
                </div>
            </aside>
            {isResetDialogOpen && (
                <ResetGameDialog
                    onCancel={() => setIsResetDialogOpen(false)}
                    onConfirm={() => {
                        onReset();
                        setIsResetDialogOpen(false);
                        onClose();
                    }}
                />
            )}
        </>
    );
}
