"use client";

import {useRef, useState, type MouseEvent, type PointerEvent} from "react";
import TurkeyMapSvg from "@/components/TurkeyMapSvg";
import styles from "./TurkeyMap.module.css";

type TurkeyMapProps = {
    onProvinceClickAction?: (provinceName: string) => void;
    wrongProvince?: string | null;
    highlightedProvinces?: string[];
    completedProvinces?: string[];
    lastCompletedProvince: string | null;
    hoveredProvince: string | null;
};

export default function TurkeyMap({
                                      onProvinceClickAction,
                                      wrongProvince,
                                      highlightedProvinces,
                                      completedProvinces,
                                      lastCompletedProvince,
                                      hoveredProvince,
                                  }: TurkeyMapProps) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<{x: number; y: number; offsetX: number; offsetY: number} | null>(null);
    const didDrag = useRef(false);

    function handleClick(event: MouseEvent<SVGSVGElement>) {
        if (didDrag.current) {
            didDrag.current = false;
            return;
        }
        const target = event.target as SVGElement;

        const provinceGroup = target.closest("g[data-iladi]");

        if (!provinceGroup) {
            return;
        }

        const provinceName = provinceGroup.getAttribute("data-iladi");

        if (!provinceName) {
            return;
        }

        onProvinceClickAction?.(provinceName);
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        if (scale === 1 || event.pointerType === "mouse" && event.button !== 0) return;
        dragStart.current = {x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y};
        didDrag.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (!dragStart.current) return;
        const x = event.clientX - dragStart.current.x;
        const y = event.clientY - dragStart.current.y;
        if (Math.abs(x) > 3 || Math.abs(y) > 3) didDrag.current = true;
        const limit = (scale - 1) * 110;
        setOffset({
            x: Math.max(-limit, Math.min(limit, dragStart.current.offsetX + x)),
            y: Math.max(-limit, Math.min(limit, dragStart.current.offsetY + y)),
        });
    }

    function stopDragging() {
        dragStart.current = null;
        setIsDragging(false);
    }

    function changeScale(amount: number) {
        setScale(current => {
            const next = Math.max(1, Math.min(2.4, current + amount));
            if (next === 1) setOffset({x: 0, y: 0});
            return next;
        });
    }

    function resetMap() {
        setScale(1);
        setOffset({x: 0, y: 0});
    }

    return <div
        className={`${styles.map} ${isDragging ? styles.isDragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
    >
        <div className={styles.canvas} style={{transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`}}>
            <TurkeyMapSvg
                onClickAction={handleClick}
                wrongProvince={wrongProvince}
                highlightedProvinces={highlightedProvinces}
                completedProvinces={completedProvinces}
                lastCompletedProvince={lastCompletedProvince}
                hoveredProvince={hoveredProvince}
            />
        </div>
        <div className={styles.controls} aria-label="Harita kontrolleri">
            <button type="button" onClick={() => changeScale(0.35)} disabled={scale === 2.4} aria-label="Haritayı yakınlaştır">+</button>
            <button type="button" onClick={() => changeScale(-0.35)} disabled={scale === 1} aria-label="Haritayı uzaklaştır">−</button>
            <button type="button" onClick={resetMap} disabled={scale === 1 && offset.x === 0 && offset.y === 0} aria-label="Türkiye'ye dön">↺</button>
        </div>
    </div>;
}
