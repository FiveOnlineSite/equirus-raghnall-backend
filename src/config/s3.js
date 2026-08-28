import { S3Client } from "@aws-sdk/client-s3";

let client;

export function getS3Client() {
  if (!client) {
    const required = [
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET",
    ];
    const missing = required.filter((name) => !process.env[name]);

    if (missing.length) {
      throw new Error(`Missing AWS environment variables: ${missing.join(", ")}`);
    }

    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
}
