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
