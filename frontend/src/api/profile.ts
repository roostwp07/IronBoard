import type { User } from "./auth";

export interface ApprovedLift {
  id: number;
  lift_type: string;
  weight_kg: string | null;
  reps: number | null;
  weight_class: string;
  scale_video_url: string;
  lift_video_url: string;
  created_at: string;
}

export interface ProfileData {
  user: User;
  lifts: ApprovedLift[];
}

export async function getProfile(token: string): Promise<ProfileData> {
  const res = await fetch("/api/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load profile");
  return json;
}

export async function getAvatarPresignedUrl(
  token: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch("/api/profile/avatar/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to get upload URL");
  return json;
}

export async function saveAvatar(token: string, key: string): Promise<string> {
  const res = await fetch("/api/profile/avatar", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to save avatar");
  return json.avatar_url;
}
