// Frontend config constants.
// These are not secrets — they're public S3 bucket info used to
// construct URLs after uploads. Actual credentials never live here.
export const S3_BUCKET = "ironboard-videos";
export const S3_REGION = "ca-central-1";

// Base URL for all S3 objects.
export const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
