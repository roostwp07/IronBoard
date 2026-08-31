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

  // New post form state.
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

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    if (!body.trim() && mediaFiles.length === 0) {
      setError("Post must have text or at least one file.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload all media files to S3 in parallel.
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

      // Prepend the new post with full user info for immediate display.
      setPosts((prev) => [
        { ...newPost, user_name: user!.name, user_id: user!.id, media: mediaKeys.map(
          (key) => `${S3_BASE_URL}/${key}`
        )},
        ...prev,
      ]);

      // Reset form.
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

  if (loading) return <main style={{ padding: 32 }}><p>Loading…</p></main>;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h1>Feed</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ── New post form (members only) ── */}
      {user && (
        <form
          onSubmit={handleSubmit}
          style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 10 }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))}
          />
          <button type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "Posting…" : "Post"}
          </button>
        </form>
      )}

      {/* ── Posts ── */}
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            style={{ borderBottom: "1px solid #eee", paddingBottom: 20, marginBottom: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong>{post.user_name}</strong>
              <span style={{ color: "#888", fontSize: 13 }}>
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            {post.body && <p style={{ margin: "0 0 10px" }}>{post.body}</p>}

            {/* Render images inline, link to videos */}
            {post.media.map((url, i) => {
              const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i);
              return isVideo ? (
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 6 }}>
                  Video {i + 1}
                </a>
              ) : (
                <img
                  key={i}
                  src={url}
                  alt=""
                  style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6, display: "block" }}
                />
              );
            })}

            {/* Show delete button for own posts or if admin */}
            {user && (user.id === post.user_id || user.role === "admin") && (
              <button
                onClick={() => handleDelete(post.id)}
                style={{ marginTop: 6, fontSize: 12, color: "red", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Delete
              </button>
            )}
          </article>
        ))
      )}
    </main>
  );
}
