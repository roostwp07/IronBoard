import { Router } from "express";
import { z } from "zod";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { query } from "../db.ts";
import { requireAuth, requireAdmin } from "../middleware/auth.ts";
import { config } from "../config.ts";
import { s3 } from "../s3.ts";

export const liftsRouter = Router();

// Extracts the S3 key from a full S3 URL.
// e.g. "https://bucket.s3.region.amazonaws.com/lifts/uuid" → "lifts/uuid"
function keyFromUrl(url: string): string {
  const u = new URL(url);
  return u.pathname.slice(1); // remove leading "/"
}

// Generates a presigned GET URL valid for 1 hour.
async function presignedGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: config.s3Bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

// POST /api/lifts/presigned-url
// Member requests a presigned S3 URL to upload one video directly.
// Returns: { uploadUrl, key }
//   uploadUrl — the temporary S3 URL the frontend PUTs the file to
//   key       — the S3 object key, sent back with the submission so we
//               know where the file ended up
liftsRouter.post("/presigned-url", requireAuth, async (req, res) => {
  const { contentType } = req.body;

  // Only allow video files.
  if (!contentType || !contentType.startsWith("video/")) {
    return res.status(400).json({ error: "contentType must be a video/* MIME type" });
  }

  // Unique key so files never overwrite each other.
  const key = `lifts/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 5 minutes — plenty of time for the upload.
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return res.json({ uploadUrl, key });
});

// POST /api/lifts/submit
// Member submits a lift after uploading both videos to S3.
const submitSchema = z.object({
  lift_type: z.enum(["squat", "bench", "deadlift", "ohp", "pullups", "chinups", "dips"]),
  weight_kg: z.number().positive().nullable(),
  reps: z.number().int().positive().nullable(),
  weight_class: z.string().min(1),
  scale_video_key: z.string().min(1),
  lift_video_key: z.string().min(1),
});

liftsRouter.post("/submit", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const { lift_type, weight_kg, reps, weight_class, scale_video_key, lift_video_key } = parsed.data;

  // Enforce the bodyweight vs weighted rule from the design decisions.
  const bodyweightLifts = ["pullups", "chinups", "dips"];
  if (bodyweightLifts.includes(lift_type)) {
    if (reps === null || weight_kg !== null) {
      return res.status(400).json({ error: "Bodyweight lifts require reps and no weight_kg" });
    }
  } else {
    if (weight_kg === null || reps !== null) {
      return res.status(400).json({ error: "Weighted lifts require weight_kg and no reps" });
    }
  }

  // Build the public S3 URLs from the keys returned after upload.
  const scaleVideoUrl = `https://${config.s3Bucket}.s3.${config.awsRegion}.amazonaws.com/${scale_video_key}`;
  const liftVideoUrl  = `https://${config.s3Bucket}.s3.${config.awsRegion}.amazonaws.com/${lift_video_key}`;

  try {
    const result = await query(
      `INSERT INTO lift_submissions
         (user_id, lift_type, weight_kg, reps, weight_class, scale_video_url, lift_video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, lift_type, weight_kg, reps, weight_class, status, created_at`,
      [req.user!.id, lift_type, weight_kg, reps, weight_class, scaleVideoUrl, liftVideoUrl]
    );
    return res.status(201).json({ submission: result.rows[0] });
  } catch (err) {
    console.error("Lift submit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/lifts/pending
// Admin sees all lift submissions awaiting review.
// Video URLs are returned as presigned GET URLs (1 hour expiry) since
// the S3 bucket is private.
liftsRouter.get("/pending", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         ls.id, ls.lift_type, ls.weight_kg, ls.reps, ls.weight_class,
         ls.scale_video_url, ls.lift_video_url, ls.created_at,
         u.name AS user_name, u.gender
       FROM lift_submissions ls
       JOIN users u ON u.id = ls.user_id
       WHERE ls.status = 'pending'
       ORDER BY ls.created_at ASC`
    );

    // Sign each video URL in parallel.
    const submissions = await Promise.all(
      result.rows.map(async (row) => ({
        ...row,
        scale_video_url: await presignedGetUrl(keyFromUrl(row.scale_video_url)),
        lift_video_url: await presignedGetUrl(keyFromUrl(row.lift_video_url)),
      }))
    );

    return res.json({ submissions });
  } catch (err) {
    console.error("Get pending lifts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/lifts/:id/approve
liftsRouter.post("/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE lift_submissions SET status = 'approved' WHERE id = $1
       RETURNING id, lift_type, status`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }
    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error("Approve lift error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/lifts/:id/reject
liftsRouter.post("/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE lift_submissions SET status = 'rejected' WHERE id = $1
       RETURNING id, lift_type, status`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }
    return res.json({ submission: result.rows[0] });
  } catch (err) {
    console.error("Reject lift error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
