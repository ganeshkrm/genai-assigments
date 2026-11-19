"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.mapMulterError = mapMulterError;
exports.uploadSinglePdf = uploadSinglePdf;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importStar(require("multer"));
const uuid_1 = require("uuid");
const env_1 = require("./env");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Secure PDF upload configuration (Phase 4).
 *
 * - Accepts only `.pdf` / `application/pdf`.
 * - Maximum size: MAX_UPLOAD_SIZE_MB (default 5 MB).
 * - Stores files in `uploads/` under safe, server-generated names
 *   (client filenames are never used for the storage path).
 */
const UPLOAD_DIR = path_1.default.resolve(process.cwd(), "uploads");
// Ensure the uploads directory exists.
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, _file, cb) => {
        // Safe temporary name — do not trust the client filename for the path.
        cb(null, `${(0, uuid_1.v4)()}.pdf`);
    },
});
function fileFilter(_req, file, cb) {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = path_1.default.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdfMime && isPdfExt) {
        cb(null, true);
    }
    else {
        cb(errorHandler_1.IngestionErrors.invalidFileType());
    }
}
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: env_1.env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    },
});
/**
 * Maps multer / fileFilter errors to stable application errors
 * (Phase 14 error table).
 */
function mapMulterError(err) {
    if (err instanceof errorHandler_1.AppError) {
        return err;
    }
    if (err instanceof multer_1.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return errorHandler_1.IngestionErrors.fileTooLarge();
        }
        return errorHandler_1.IngestionErrors.fileRequired();
    }
    return errorHandler_1.IngestionErrors.fileRequired();
}
/**
 * Express middleware that runs the single-file "file" upload and routes
 * any multer / filter error through the central error handler with a
 * stable error code.
 */
function uploadSinglePdf(req, res, next) {
    exports.upload.single("file")(req, res, (err) => {
        if (err) {
            next(mapMulterError(err));
            return;
        }
        next();
    });
}
//# sourceMappingURL=multerConfig.js.map