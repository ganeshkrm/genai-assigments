import path from "path";
import fs from "fs";
import multer, { FileFilterCallback, MulterError } from "multer";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";
import { AppError, IngestionErrors } from "../middleware/errorHandler";

/**
 * Secure PDF upload configuration (Phase 4).
 *
 * - Accepts only `.pdf` / `application/pdf`.
 * - Maximum size: MAX_UPLOAD_SIZE_MB (default 5 MB).
 * - Stores files in `uploads/` under safe, server-generated names
 *   (client filenames are never used for the storage path).
 */
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure the uploads directory exists.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, _file, cb) => {
    // Safe temporary name — do not trust the client filename for the path.
    cb(null, `${uuidv4()}.pdf`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(IngestionErrors.invalidFileType());
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
});

/**
 * Maps multer / fileFilter errors to stable application errors
 * (Phase 14 error table).
 */
export function mapMulterError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return IngestionErrors.fileTooLarge();
    }
    return IngestionErrors.fileRequired();
  }
  return IngestionErrors.fileRequired();
}

/**
 * Express middleware that runs the single-file "file" upload and routes
 * any multer / filter error through the central error handler with a
 * stable error code.
 */
export function uploadSinglePdf(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  upload.single("file")(req, res, (err: unknown) => {
    if (err) {
      next(mapMulterError(err));
      return;
    }
    next();
  });
}
