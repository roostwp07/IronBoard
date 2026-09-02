interface AvatarProps {
  name: string;
  avatarUrl: string | null;
  size?: number;
}

// Derives initials from a full name — e.g. "Parmida Wang" → "PW".
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Avatar({ name, avatarUrl, size = 32 }: AvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.36,
    fontWeight: 600,
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--accent-dim)",
    userSelect: "none",
  };

  if (avatarUrl) {
    return (
      <div style={style}>
        <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  return <div style={style}>{initials(name)}</div>;
}
