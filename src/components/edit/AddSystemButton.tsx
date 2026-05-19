"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";

export default function AddSystemButton({ campaignId }: { campaignId: string }) {
  const { isCampaignUnlocked } = useSession();
  const [open, setOpen] = useState(false);
  if (!isCampaignUnlocked(campaignId)) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="hud-button"
        style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.15)" }}>
        + AJOUTER UN SYSTEME
      </button>
      {open && <QuickCreateModal mode={{ kind: "system", campaignId }} onClose={() => setOpen(false)} />}
    </>
  );
}
