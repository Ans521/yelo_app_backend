import { randomBytes } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';

const uploadDir = 'upload';

export const multerUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname) || '.jpg';
      const name = randomBytes(12).toString('hex') + ext; // generate a random name for the file
      cb(null, name);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
};
