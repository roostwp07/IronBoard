import { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { query } from "../db.ts";
import { requireAuth } from "../middleware/auth.ts";
import { config } from "../config.ts";
import { s3 } from "../s3.ts";

export const profileRouter = Router();

// GET /api/profile
profileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         id, lift_type, weight_kg, reps, weight_class,
         scale_video_url, lift_video_url, created_at
       FROM lift_submissions
       WHERE user_id = $1 AND status = 'approved'
       ORDER BY lift_type, weight_kg DESC NULLS LAST, reps DESC NULLS LAST`,
      [req.user!.id]
    );
    return res.json({ user: req.user, lifts: result.rows });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/profile/avatar/presigned-url
// Get a presigned URL to upload an avatar image directly to S3.
profileRouter.post("/avatar/presigned-url", requireAuth, async (req, res) => {
  const { contentType } = req.body;
  if (!contentType || !contentType.startsWith("image/")) {
    return res.status(400).json({ error: "contentType must be an image/* MIME type" });
  }
  const key = `avatars/${req.user!.id}-${randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return res.json({ uploadUrl, key });
});

// PUT /api/profile/avatar
// Save the S3 key as the user's avatar_url after upload.
profileRouter.put("/avatar", requireAuth, async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "key is required" });

  const avatarUrl = `https://${config.s3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;

  try {
    await query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2`,
      [avatarUrl, req.user!.id]
    );
    return res.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error("Avatar update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
