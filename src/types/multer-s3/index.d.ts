declare module 'multer-s3' {
  import { S3Client } from '@aws-sdk/client-s3';
  import { StorageEngine } from 'multer';

  interface MulterS3Options {
    s3: S3Client;
    bucket:
      | string
      | ((
          req: any,
          file: any,
          cb: (error: any, bucket?: string) => void,
        ) => void);
    key?: (req: any, file: any, cb: (error: any, key?: string) => void) => void;
    acl?:
      | string
      | ((req: any, file: any, cb: (error: any, acl?: string) => void) => void);
    contentType?: any;
    metadata?: any;
    cacheControl?: any;
    contentDisposition?: any;
    serverSideEncryption?: any;
    s3UploadParams?: any;
  }

  function multerS3(options: MulterS3Options): StorageEngine;
  namespace multerS3 {
    const AUTO_CONTENT_TYPE: any;
  }

  export = multerS3;
}
