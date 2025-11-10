import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../env';

export function createMulterS3ImageUploader(s3Client: S3Client) {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: 'client-dashboard',
      key: (req, file, cb) => {
        const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
        const key = `calculation_requests/${req.contact.ID}_${Date.now()}-${fileName}`;
        cb(null, key);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: {
      fileSize: ENV.CALCULATION_REQUEST_PHOTO_MAX_FILESIZE_IN_MB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/heic',
        'image/heif',
        'image/bmp',
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error('Only image files (png, jpeg, jpg, heic, bmp) are allowed'),
        );
      }
    },
  });
}
