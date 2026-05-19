"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface SessionInfo {
  campaignId: string;
  token: string;
}

interface SessionContextValue {
  session: SessionInfo | null;
  isEditing: boolean;
  loginCampaign: (campaignId: string, token: string) => void;
  logoutCampaign: () => void;
  isCampaignUnlocked: (campaignId: string) => boolean;
}

const Ctx = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "wh40k_campaign_session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const loginCampaign = useCallback((campaignId: string, token: string) => {
    const s = { campaignId, token };
    setSession(s);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }, []);

  const logoutCampaign = useCallback(() => {
    setSession(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const isCampaignUnlocked = useCallback(
    (campaignId: string) => session?.campaignId === campaignId,
    [session]
  );

  return (
    <Ctx.Provider
      value={{
        session,
        isEditing: !!session,
        loginCampaign,
        logoutCampaign,
        isCampaignUnlocked,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
