import type React from "react";

export const FACTION_SYMBOLS = ["aigle", "crane", "etoile", "croix", "tribord"] as const;
export type FactionSymbolKey = typeof FACTION_SYMBOLS[number];

interface SymbolProps {
  size?: number;
  color?: string;
}

function Aigle({ size = 24, color = "#ffffff" }: SymbolProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color}>
      <path d="M32 8 L24 18 L8 16 L16 24 L8 32 L20 32 L20 40 L12 48 L24 44 L32 56 L40 44 L52 48 L44 40 L44 32 L56 32 L48 24 L56 16 L40 18 Z" />
    </svg>
  );
}
function Crane({ size = 24, color = "#ffffff" }: SymbolProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color}>
      <path d="M32 6 C18 6 10 16 10 28 C10 36 14 42 18 44 L18 50 L26 50 L26 56 L30 56 L30 50 L34 50 L34 56 L38 56 L38 50 L46 50 L46 44 C50 42 54 36 54 28 C54 16 46 6 32 6 Z M22 26 A4 4 0 1 1 22 27 Z M42 26 A4 4 0 1 1 42 27 Z M32 36 L28 42 L36 42 Z" />
    </svg>
  );
}
function Etoile({ size = 24, color = "#ffffff" }: SymbolProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color}>
      <path d="M32 4 L38 24 L60 24 L42 36 L48 56 L32 44 L16 56 L22 36 L4 24 L26 24 Z" />
    </svg>
  );
}
function Croix({ size = 24, color = "#ffffff" }: SymbolProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color}>
      <path d="M26 4 L38 4 L38 22 L56 22 L56 34 L38 34 L38 60 L26 60 L26 34 L8 34 L8 22 L26 22 Z" />
    </svg>
  );
}
function Tribord({ size = 24, color = "#ffffff" }: SymbolProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color}>
      <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="32" cy="32" r="10" />
      <path d="M32 6 L32 16 M32 48 L32 58 M6 32 L16 32 M48 32 L58 32" stroke={color} strokeWidth="4" fill="none" />
    </svg>
  );
}

const MAP: Record<FactionSymbolKey, React.FC<SymbolProps>> = {
  aigle: Aigle, crane: Crane, etoile: Etoile, croix: Croix, tribord: Tribord,
};

export function FactionSymbol({ symbol, size = 24, color = "#ffffff" }: { symbol?: string | null; size?: number; color?: string }) {
  const key = (symbol as FactionSymbolKey) || "etoile";
  const Cmp = MAP[key] ?? Etoile;
  return <Cmp size={size} color={color} />;
}

export const SYMBOL_LABELS: Record<FactionSymbolKey, string> = {
  aigle: "Aigle", crane: "Crâne", etoile: "Étoile", croix: "Croix", tribord: "Compas",
};
