"use client";

import PortalToBody from "@/components/overlays/PortalToBody";
import PermanentHud from "@/components/hud/PermanentHud";
import ZonePanel from "@/components/zone/ZonePanel";
import BattleModal from "@/components/battle/BattleModal";
import ChronicleModal from "@/components/chronicle/ChronicleModal";

export default function GlobalOverlays() {
  return (
    <PortalToBody>
      <PermanentHud />
      <ZonePanel />
      <BattleModal />
      <ChronicleModal />
    </PortalToBody>
  );
}
