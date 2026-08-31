export interface Post {
  id: number;
  body: string | null;
  created_at: string;
  user_id: number;
  user_name: string;
  media: string[]; // S3 URLs
}

// Fetch all posts (public).
export async function getPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch posts");
  return json.posts;
}

// Get a presigned S3 URL for one media file upload.
export async function getPostPresignedUrl(
  token: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch("/api/posts/presigned-url", {
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

// Upload a file directly to S3 using a presigned URL.
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Failed to upload file to S3");
}

// Create a new post.
export async function createPost(
  token: string,
  data: { body?: string; media_keys?: string[] }
): Promise<Post> {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create post");
  return json.post;
}

// Delete a post (own posts for members, any post for admins).
export async function deletePost(token: string, postId: number): Promise<void> {
  const res = await fetch(`/api/posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to delete post");
  }
}
