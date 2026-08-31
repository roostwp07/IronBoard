import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./config.ts";

// Single shared S3 client for the whole app.
// Credentials are picked up automatically from AWS_ACCESS_KEY_ID and
// AWS_SECRET_ACCESS_KEY environment variables loaded by dotenv.
export const s3 = new S3Client({ region: config.awsRegion });
