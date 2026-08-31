import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPresignedUrl, uploadToS3, submitLift, type LiftType } from "../api/lifts";

const WEIGHTED_LIFTS = ["squat", "bench", "deadlift", "ohp"];
const BODYWEIGHT_LIFTS = ["pullups", "chinups", "dips"];
const ALL_LIFTS = [...WEIGHTED_LIFTS, ...BODYWEIGHT_LIFTS];

const WEIGHT_CLASSES = [
  "47kg", "52kg", "57kg", "63kg", "69kg", "74kg",
  "83kg", "93kg", "105kg", "120kg", "120kg+",
];

export default function LogLiftPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [liftType, setLiftType] = useState<LiftType>("squat");
  const [weightKg, setWeightKg] = useState("");
  const [reps, setReps] = useState("");
  const [weightClass, setWeightClass] = useState("83kg");
  const [scaleVideo, setScaleVideo] = useState<File | null>(null);
  const [liftVideo, setLiftVideo] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isBodyweight = BODYWEIGHT_LIFTS.includes(liftType);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    if (!scaleVideo || !liftVideo) {
      setError("Both videos are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get two presigned URLs in parallel — no need to wait for one before the other.
      const [scaleResult, liftResult] = await Promise.all([
        getPresignedUrl(token, scaleVideo.type),
        getPresignedUrl(token, liftVideo.type),
      ]);

      // Upload both videos directly to S3 in parallel.
      await Promise.all([
        uploadToS3(scaleResult.uploadUrl, scaleVideo),
        uploadToS3(liftResult.uploadUrl, liftVideo),
      ]);

      // Submit the lift with the S3 keys.
      await submitLift(token, {
        lift_type: liftType,
        weight_kg: isBodyweight ? null : parseFloat(weightKg),
        reps: isBodyweight ? parseInt(reps) : null,
        weight_class: weightClass,
        scale_video_key: scaleResult.key,
        lift_video_key: liftResult.key,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px" }}>
        <h1>Submitted!</h1>
        <p>Your lift is pending admin review. It'll appear on the leaderboard once approved.</p>
        <button onClick={() => navigate("/leaderboard")}>Back to leaderboard</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px" }}>
      <h1>Log a Lift</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <label>
          Lift type
          <select
            value={liftType}
            onChange={(e) => setLiftType(e.target.value as LiftType)}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          >
            {ALL_LIFTS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label>
          Weight class
          <select
            value={weightClass}
            onChange={(e) => setWeightClass(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          >
            {WEIGHT_CLASSES.map((wc) => (
              <option key={wc} value={wc}>{wc}</option>
            ))}
          </select>
        </label>

        {/* Show weight OR reps depending on lift type */}
        {isBodyweight ? (
          <label>
            Reps
            <input
              type="number"
              min={1}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        ) : (
          <label>
            Weight (kg)
            <input
              type="number"
              min={0}
              step={0.5}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        )}

        <label>
          Scale video <span style={{ color: "#888", fontSize: 13 }}>(proves your weight class)</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setScaleVideo(e.target.files?.[0] ?? null)}
            required
            style={{ display: "block", marginTop: 4 }}
          />
        </label>

        <label>
          Lift video <span style={{ color: "#888", fontSize: 13 }}>(proves the lift)</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setLiftVideo(e.target.files?.[0] ?? null)}
            required
            style={{ display: "block", marginTop: 4 }}
          />
        </label>

        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Uploading…" : "Submit lift"}
        </button>
      </form>
    </main>
  );
}
