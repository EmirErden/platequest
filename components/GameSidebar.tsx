import {provinces} from "@/data/provinces";
import styles from "./GameSidebar.module.css";
import {useState} from "react";

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

                <div className={styles.progressCard}>
                    <div className={styles.progressInfo}>
                        <span>Genel İlerleme</span>
                        <strong>
                            {completedProvinces.length} / {provinces.length}
                        </strong>
                    </div>

                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressBar}
                            style={{
                                width: `${(completedProvinces.length / provinces.length) * 100}%`,
                            }}
                        />
                    </div>

                    <span className={styles.progressPercentage}>
                        %{Math.round(
                        (completedProvinces.length / provinces.length) * 100
                    )} tamamlandı
                    </span>
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
                <div className={styles.dialogOverlay}>
                    <div className={styles.dialog}>
                        <div className={styles.dialogIcon}>!</div>
                        <h2>İlerlemeyi sıfırla?</h2>
                        <p>
                            Tamamladığın tüm iller silinecek ve oyun baştan başlayacak.
                        </p>

                        <div className={styles.dialogActions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={() => setIsResetDialogOpen(false)}
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                className={styles.confirmResetButton}
                                onClick={() => {
                                    onReset();
                                    setIsResetDialogOpen(false);
                                    onClose();
                                }}
                            >
                                Sıfırla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}