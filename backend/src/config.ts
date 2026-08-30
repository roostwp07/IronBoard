import "dotenv/config";

// Read required config once, at startup. If the secret is missing we
// crash immediately with a clear message rather than signing tokens
// with `undefined` and failing mysteriously later.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}

export const config = {
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: "7d" as const, // literal type so jwt.sign's overload accepts it
};
