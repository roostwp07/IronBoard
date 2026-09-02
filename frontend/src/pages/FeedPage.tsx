import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPosts,
  createPost,
  deletePost,
  getPostPresignedUrl,
  uploadToS3,
  type Post,
} from "../api/posts";
import { S3_BASE_URL } from "../config";

export default function FeedPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!token) return;
    if (!body.trim() && mediaFiles.length === 0) {
      setError("Post must have text or at least one file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mediaKeys = await Promise.all(
        mediaFiles.map(async (file) => {
          const { uploadUrl, key } = await getPostPresignedUrl(token, file.type);
          await uploadToS3(uploadUrl, file);
          return key;
        })
      );
      const newPost = await createPost(token, {
        body: body.trim() || undefined,
        media_keys: mediaKeys,
      });
      setPosts((prev) => [
        { ...newPost, user_name: user!.name, user_id: user!.id, media: mediaKeys.map((key) => `${S3_BASE_URL}/${key}`) },
        ...prev,
      ]);
      setBody("");
      setMediaFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId: number) {
    if (!token) return;
    try {
      await deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  }

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <h1>Feed</h1>

      {error && <p className="error-msg" style={{ marginBottom: "var(--gap-md)" }}>{error}</p>}

      {/* ── New post form (members only) ── */}
      {user && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "var(--gap-xl)", display: "flex", flexDirection: "column", gap: "var(--gap-sm)" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            style={{ resize: "vertical" }}
          />

          {/* Hidden real file input */}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))}
            style={{ display: "none" }}
          />

          {/* Selected file tags */}
          {mediaFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-xs)" }}>
              {mediaFiles.map((f, i) => (
                <span key={i} style={{
                  fontSize: "var(--text-sm)",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "2px 8px",
                  color: "var(--text)",
                }}>
                  {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Action row: Attach + Post */}
          <div style={{ display: "flex", gap: "var(--gap-sm)" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: "var(--text-sm)", padding: "5px 12px" }}
            >
              Attach
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {/* ── Posts ── */}
      {posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>
          {posts.map((post) => (
            <article key={post.id} style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "var(--gap-md)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--gap-sm)" }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-strong)" }}>{post.user_name}</span>
                <span className="muted">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              {post.body && (
                <p style={{ color: "var(--text-strong)", marginBottom: post.media.length > 0 ? "var(--gap-sm)" : 0 }}>
                  {post.body}
                </p>
              )}

              {post.media.map((url, i) => {
                const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i);
                return isVideo ? (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--gap-xs)" }}>
                    Video {i + 1} ↗
                  </a>
                ) : (
                  <img key={i} src={url} alt="" style={{ maxWidth: "100%", borderRadius: "var(--radius)", marginBottom: "var(--gap-xs)", display: "block" }} />
                );
              })}

              {user && (user.id === post.user_id || user.role === "admin") && (
                <button className="btn-danger" onClick={() => handleDelete(post.id)} style={{ marginTop: "var(--gap-sm)" }}>
                  Delete
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
