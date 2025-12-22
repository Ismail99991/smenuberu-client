// src/lib/uploadObjectPhoto.ts
import { api } from "./api";

export async function uploadObjectPhoto(objectId: string, file: File): Promise<string> {
  const presign = await api<{ ok: true; uploadUrl: string; publicUrl: string }>(
    "/uploads/object-photo",
    { method: "POST", json: { objectId, contentType: file.type } }
  );

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);

  return presign.publicUrl;
}
