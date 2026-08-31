const BASE = "/api/lifts";

export type LiftType = "squat" | "bench" | "deadlift" | "ohp" | "pullups" | "chinups" | "dips";

export interface PendingSubmission {
  id: number;
  lift_type: LiftType;
  weight_kg: string | null;
  reps: number | null;
  weight_class: string;
  scale_video_url: string;
  lift_video_url: string;
  created_at: string;
  user_name: string;
  gender: string;
}

// Step 1 of upload flow: get a presigned URL for one video file.
export async function getPresignedUrl(
  token: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch(`${BASE}/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to get upload URL");
  return json;
}

// Step 2 of upload flow: PUT the file directly to S3 using the presigned URL.
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Failed to upload video to S3");
}

// Step 3: submit the lift with the S3 keys.
export async function submitLift(
  token: string,
  data: {
    lift_type: LiftType;
    weight_kg: number | null;
    reps: number | null;
    weight_class: string;
    scale_video_key: string;
    lift_video_key: string;
  }
): Promise<void> {
  const res = await fetch(`${BASE}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to submit lift");
}

// Admin: fetch all pending lift submissions.
export async function getPendingLifts(token: string): Promise<PendingSubmission[]> {
  const res = await fetch(`${BASE}/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch pending lifts");
  return json.submissions;
}

// Admin: approve a submission.
export async function approveLift(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to approve lift");
}

// Admin: reject a submission.
export async function rejectLift(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to reject lift");
}
