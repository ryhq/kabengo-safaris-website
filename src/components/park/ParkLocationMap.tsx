"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const ParkMap = dynamic(() => import("@/components/ui/ParkMap"), { ssr: false });

interface ParkLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export default function ParkLocationMap({ latitude, longitude, name }: ParkLocationMapProps) {
  const t = useTranslations("parks");
  return (
    <div>
      <h2 className="text-2xl font-bold text-stone-800 font-serif mb-6">{t("detail.location")}</h2>
      <div className="rounded-2xl overflow-hidden border border-stone-200 h-[350px]">
        <ParkMap latitude={latitude} longitude={longitude} name={name} />
      </div>
    </div>
  );
}
