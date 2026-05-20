"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/campaign-context";
import BattleEditor from "@/components/battle/BattleEditor";
import PortalToBody from "@/components/overlays/PortalToBody";

interface Props { campaignId: string; onClose: () => void }

export default function BattleQuickCreate(props: Props) {
  return (
    <PortalToBody>
      <BattleQuickCreateInner {...props} />
    </PortalToBody>
  );
}

function BattleQuickCreateInner({ campaignId, onClose }: Props) {
  const { systems, planets, zones } = useCampaign();
  const [systemId, setSystemId] = useState<string>("");
  const [planetId, setPlanetId] = useState<string>("");
  const [zoneId, setZoneId] = useState<string>("");

  const filteredPlanets = planets.filter((p) => p.system_id === systemId);
  const filteredZones = zones.filter((z) => z.planet_id === planetId);

  if (zoneId) {
    return <BattleEditor zoneId={zoneId} campaignId={campaignId} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="hud-panel hud-panel--strong max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="hud-label mb-1">NOUVELLE BATAILLE</div>
        <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-cyan)" }}>Localiser la bataille</h2>

        <div className="space-y-3 mb-4">
          <div>
            <div className="hud-label mb-1">SECTEUR</div>
            <select value={systemId} onChange={(e) => { setSystemId(e.target.value); setPlanetId(""); setZoneId(""); }}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
              <option value="">-- Selectionner un secteur --</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {systemId && (
            <div>
              <div className="hud-label mb-1">PLANÈTE</div>
              <select value={planetId} onChange={(e) => { setPlanetId(e.target.value); setZoneId(""); }}
                className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                <option value="">-- Selectionner une planète --</option>
                {filteredPlanets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {planetId && (
            <div>
              <div className="hud-label mb-1">ZONE</div>
              {filteredZones.length === 0 ? (
                <div className="hud-panel--inset px-3 py-2 font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                  Cette planète n'a aucune zone. Crée-en une depuis la vue planète.
                </div>
              ) : (
                <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                  <option value="">-- Selectionner une zone --</option>
                  {filteredZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              )}
            </div>
          )}
        </div>

        <div cl