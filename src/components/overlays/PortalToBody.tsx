"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Rend ses enfants dans document.body via React Portal.
 * Garantit que les "position: fixed" ne sont jamais piegés par un containing block
 * (transform/filter/backdrop-filter sur un ancetre).
 */
export default function PortalToBody({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
