"use client";

/**
 * Upload direct (unsigned) vers Cloudinary depuis le navigateur.
 * Nécessite NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME et NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    return { ok: false, error: "Cloudinary non configuré (cloud_name / preset manquants)" };
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  if (folder) fd.append("folder", folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body: fd,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    const url: string | undefined = json?.secure_url ?? json?.url;
    if (!url) return { ok: false, error: "URL absente de la réponse Cloudinary" };
    return { ok: true, url };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur réseau" };
  }
}

/** Limite raisonnable côté navigateur avant upload (10 MB). */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
