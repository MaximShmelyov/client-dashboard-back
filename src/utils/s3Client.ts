import { S3Client } from '@aws-sdk/client-s3';
import { ENV } from '../env';

export function createS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: ENV.S3_ENDPOINT_URL,
    credentials: {
      accessKeyId: ENV.S3_ACCESS_KEY_ID,
      secretAccessKey: ENV.S3_SECRET_ACCESS_KEY!,
    },
  });
}
