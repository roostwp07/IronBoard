import { Router } from "express";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { query } from "../db.ts";
import { requireAuth, requireAdmin } from "../middleware/auth.ts";
import { config } from "../config.ts";
import { s3 } from "../s3.ts";

export const postsRouter = Router();

// GET /api/posts
// Public — returns all posts with their media, newest first.
postsRouter.get("/", async (_req, res) => {
  try {
    // Fetch all posts joined with author name.
    const postsResult = await query(
      `SELECT p.id, p.body, p.created_at, u.id AS user_id, u.name AS user_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );

    // Fetch all media in one query and group by post_id in JS —
    // more efficient than a separate query per post.
    const mediaResult = await query(
      `SELECT post_id, media_url FROM post_media`
    );

    const mediaByPost: Record<number, string[]> = {};
    for (const row of mediaResult.rows) {
      if (!mediaByPost[row.post_id]) mediaByPost[row.post_id] = [];
      mediaByPost[row.post_id].push(row.media_url);
    }

    const posts = postsResult.rows.map((p) => ({
      ...p,
      media: mediaByPost[p.id] ?? [],
    }));

    return res.json({ posts });
  } catch (err) {
    console.error("Get posts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts/presigned-url
// Member requests a presigned S3 URL to upload one media file.
postsRouter.post("/presigned-url", requireAuth, async (req, res) => {
  const { contentType } = req.body;

  if (!contentType || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
    return res.status(400).json({ error: "contentType must be image/* or video/*" });
  }

  const key = `posts/${randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return res.json({ uploadUrl, key });
});

// POST /api/posts
// Member creates a post. Body is optional if media_keys are provided.
const createPostSchema = z.object({
  body: z.string().min(1).optional(),
  // S3 keys returned from the presigned URL endpoint after upload.
  media_keys: z.array(z.string()).max(10).optional().default([]),
}).refine(
  (d) => d.body || (d.media_keys && d.media_keys.length > 0),
  { message: "Post must have text or at least one media file" }
);

postsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const { body, media_keys } = parsed.data;

  try {
    // Insert the post first to get its id.
    const postResult = await query(
      `INSERT INTO posts (user_id, body) VALUES ($1, $2)
       RETURNING id, body, created_at`,
      [req.user!.id, body ?? null]
    );
    const post = postResult.rows[0];

    // Insert a post_media row for each uploaded file.
    if (media_keys && media_keys.length > 0) {
      for (const key of media_keys) {
        const url = `https://${config.s3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
        await query(
          `INSERT INTO post_media (post_id, media_url) VALUES ($1, $2)`,
          [post.id, url]
        );
      }
    }

    return res.status(201).json({ post });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/posts/:id
// Members can delete their own posts; admins can delete any post.
postsRouter.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the post first to check ownership.
    const existing = await query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isOwner = existing.rows[0].user_id === req.user!.id;
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not allowed to delete this post" });
    }

    // ON DELETE CASCADE in schema handles post_media cleanup automatically.
    await query(`DELETE FROM posts WHERE id = $1`, [id]);
    return res.status(204).send();
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
