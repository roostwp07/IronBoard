import { useState } from "react";
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

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!token) return;
    if (!scaleVideo || !liftVideo) {
      setError("Both videos are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [scaleResult, liftResult] = await Promise.all([
        getPresignedUrl(token, scaleVideo.type),
        getPresignedUrl(token, liftVideo.type),
      ]);
      await Promise.all([
        uploadToS3(scaleResult.uploadUrl, scaleVideo),
        uploadToS3(liftResult.uploadUrl, liftVideo),
      ]);
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
      <div className="page">
        <div style={{ width: "min(480px, 90%)", margin: "0 auto" }}>
          <h1>Submitted</h1>
          <p style={{ marginBottom: "var(--gap-lg)" }}>
            Your lift is pending admin review. It'll appear on the leaderboard once approved.
          </p>
          <button className="btn-ghost" onClick={() => navigate("/leaderboard")}>
            Back to leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ width: "min(480px, 90%)", margin: "0 auto" }}>
        <h1>Log a lift</h1>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <label htmlFor="lift-type">Lift</label>
            <select id="lift-type" value={liftType} onChange={(e) => setLiftType(e.target.value as LiftType)}>
              {ALL_LIFTS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="weight-class">Weight class</label>
            <select id="weight-class" value={weightClass} onChange={(e) => setWeightClass(e.target.value)}>
              {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
            </select>
          </div>
          {isBodyweight ? (
            <div className="form-row">
              <label htmlFor="reps">Reps</label>
              <input id="reps" type="number" min={1} value={reps} onChange={(e) => setReps(e.target.value)} required />
            </div>
          ) : (
            <div className="form-row">
              <label htmlFor="weight">Weight (kg)</label>
              <input id="weight" type="number" min={0} step={0.5} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
            </div>
          )}
          <div className="form-row">
            <label htmlFor="scale-video">
              Scale video <span className="muted">— proves your weight class</span>
            </label>
            <input id="scale-video" type="file" accept="video/*" onChange={(e) => setScaleVideo(e.target.files?.[0] ?? null)} required />
          </div>
          <div className="form-row">
            <label htmlFor="lift-video">
              Lift video <span className="muted">— proves the lift</span>
            </label>
            <input id="lift-video" type="file" accept="video/*" onChange={(e) => setLiftVideo(e.target.files?.[0] ?? null)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Uploading…" : "Submit lift"}
          </button>
        </form>
      </div>
    </div>
  );
}
