"use client";

import type {MouseEvent} from "react";
import TurkeyMapSvg from "@/components/TurkeyMapSvg";

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
    function handleClick(event: MouseEvent<SVGSVGElement>) {
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

    return <TurkeyMapSvg
        onClickAction={handleClick}
        wrongProvince={wrongProvince}
        highlightedProvinces={highlightedProvinces}
        completedProvinces={completedProvinces}
        lastCompletedProvince={lastCompletedProvince}
        hoveredProvince={hoveredProvince}
    />;
}