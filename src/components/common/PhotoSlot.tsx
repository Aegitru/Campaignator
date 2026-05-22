"use client";

import { useRef, useState } from "react";
import { uploadToCloudinary, MAX_PHOTO_BYTES } from "@/lib/cloudinary-upload";

/**
 * Slot photo unique : preview + bouton uploader / remplacer / retirer.
 * Le parent gère la persistance via `onChange` (URL Cloudinary ou null).
 */
export default function PhotoSlot({
  value,
  onChange,
  folder,
  disabled,
  label = "PHOTO",
  height = 180,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void | Promise<void>;
  folder?: string;
  disabled?: boolean;
  label?: string;
  height?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Image > 10 Mo");
      return;
    }
    setError(null);
    setUploading(true);
    const res = await uploadToCloudinary(file, folder);
    setUploading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await onChange(res.url);
  };

  const remove = async () => {
    if (disabled || uploading) return;
    await onChange(null);
  };

  return (
    <div>
      <div className="hud-label mb-1">{label}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {value ? (
        <div className="relative" style={{ height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover border"
            style={{ borderColor: "var(--border-glow)" }}
          />
          {!disabled && (
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                onClick={pick}
                disabled={uploading}
                className="hud-button"
                style={{ padding: "0.25rem 0.55rem", fontSize: "0.6rem" }}
              >
                {uploading ? "..." : "REMPLACER"}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={uploading}
                className="hud-button"
                style={{
                  padding: "0.25rem 0.55rem",
                  fontSize: "0.6rem",
                  color: "#ff7070",
                  borderColor: "#8b1a1a",
                }}
              >
                RETIRER
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || uploading}
          className="w-full hud-panel--inset flex items-center justify-center font-mono text-xs"
          style={{
            height,
            cursor: disabled ? "not-allowed" : "crosshair",
            color: "var(--text-secondary)",
            borderStyle: "dashed",
          }}
        >
          {uploading ? "ENVOI EN COURS..." : "+ AJOUTER UNE PHOTO"}
        </button>
      )}

      {error && (
        <div
          className="mt-2 px-2 py-1 font-mono text-[11px]"
          style={{
            color: "#ff7070",
            background: "rgba(139,26,26,0.18)",
            border: "1px solid #8b1a1a",
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
