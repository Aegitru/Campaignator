"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
  Alliance,
  Battle,
  Campaign,
  Faction,
  Planet,
  StellarSystem,
  Zone,
} from "@/types/domain";

interface CampaignData {
  campaign: Campaign;
  alliances: Alliance[];
  factions: Faction[];
  systems: StellarSystem[];
  planets: Planet[];
  zones: Zone[];
  battles: Battle[];
}

interface UIState {
  chronicleOpen: boolean;
  selectedBattleId: string | null;
  selectedZoneId: string | null;
}

interface CampaignContextValue extends CampaignData, UIState {
  openChronicle: () => void;
  closeChronicle: () => void;
  openBattle: (id: string) => void;
  closeBattle: () => void;
  openZone: (id: string) => void;
  closeZone: () => void;
}

const Ctx = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({
  data,
  children,
}: {
  data: CampaignData;
  children: React.ReactNode;
}) {
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const openChronicle = useCallback(() => setChronicleOpen(true), []);
  const closeChronicle = useCallback(() => setChronicleOpen(false), []);
  const openBattle = useCallback((id: string) => setSelectedBattleId(id), []);
  const closeBattle = useCallback(() => setSelectedBattleId(null), []);
  const openZone = useCallback((id: string) => setSelectedZoneId(id), []);
  const closeZone = useCallback(() => setSelectedZoneId(null), []);

  const value = useMemo<CampaignContextValue>(
    () => ({
      ...data,
      chronicleOpen,
      selectedBattleId,
      selectedZoneId,
      openChronicle,
      closeChronicle,
      openBattle,
      closeBattle,
      openZone,
      closeZone,
    }),
    [
      data,
      chronicleOpen,
      selectedBattleId,
      selectedZoneId,
      openChronicle,
      closeChronicle,
      openBattle,
      closeBattle,
      openZone,
      closeZone,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return ctx;
}
