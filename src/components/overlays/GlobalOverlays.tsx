"use client";

import PermanentHud from "@/components/hud/PermanentHud";
import ZonePanel from "@/components/zone/ZonePanel";
import BattleModal from "@/components/battle/BattleModal";
import ChronicleModal from "@/components/chronicle/ChronicleModal";

/**
 * Tous les overlays globaux mounted une seule fois dans le layout.
 * - Le HUD se cache lui-même sur '/' via usePathname
 * - Les modals sont rendus en fonction de l'état du CampaignContext
 */
export default function GlobalOverlays() {
  return (
    <>
      <PermanentHud />
      <ZonePanel />
      <BattleModal />
      <ChronicleModal />
    </>
  );
}
