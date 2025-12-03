import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

// Extend Request interface to include file
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Configuration
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/json', 'text/plain', 'application/pdf'];
const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`[Upload Middleware] Created upload directory: ${UPLOAD_DIR}`);
}

// Storage configuration
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectory based on file type
    let subDir = 'general';
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      subDir = 'images';
    } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      subDir = 'documents';
    }

    const destPath = path.join(UPLOAD_DIR, subDir);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Memory storage (for processing files in memory)
const memoryStorage = multer.memoryStorage();

// File filter function
function createFileFilter(allowedTypes: string[]) {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };
}

// Error handler
function handleUploadError(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `File quá lớn. Kích thước tối đa: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Quá nhiều files. Vui lòng chọn ít hơn.',
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'File field không hợp lệ.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  if (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Lỗi khi upload file',
    });
    return;
  }

  next();
}

// Single file upload middleware (disk storage)
export const uploadSingle = (fieldName: string = 'file', allowedTypes: string[] = ALLOWED_ALL_TYPES) => {
  const upload = multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: createFileFilter(allowedTypes),
  });

  return [
    upload.single(fieldName),
    handleUploadError,
  ];
};

// Multiple files upload middleware (disk storage)
export const uploadMultiple = (
  fieldName: string = 'files',
  maxCount: number = 5,
  allowedTypes: string[] = ALLOWED_ALL_TYPES
) => {
  const upload = multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: maxCount,
    },
    fileFilter: createFileFilter(allowedTypes),
  });

  return [
    upload.array(fieldName, maxCount),
    handleUploadError,
  ];
};

// Image upload middleware (disk storage)
export const uploadImage = (fieldName: string = 'image') => {
  return uploadSingle(fieldName, ALLOWED_IMAGE_TYPES);
};

// Document upload middleware (disk storage)
export const uploadDocument = (fieldName: string = 'document') => {
  return uploadSingle(fieldName, ALLOWED_DOCUMENT_TYPES);
};

// Memory upload middleware (for processing files in memory)
export const uploadMemory = (fieldName: string = 'file', allowedTypes: string[] = ALLOWED_ALL_TYPES) => {
  const upload = multer({
    storage: memoryStorage,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: createFileFilter(allowedTypes),
  });

  return [
    upload.single(fieldName),
    handleUploadError,
  ];
};

// Avatar upload middleware (specific for user avatars)
export const uploadAvatar = () => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const destPath = path.join(UPLOAD_DIR, 'avatars');
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
      },
      filename: (req, file, cb) => {
        const userId = (req as any).user?.id || 'anonymous';
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB for avatars
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
  });

  return [
    upload.single('avatar'),
    handleUploadError,
  ];
};

// Helper function to get file URL
export function getFileUrl(file: Express.Multer.File): string {
  if (!file) return '';
  
  const relativePath = file.path.replace(path.join(__dirname, '../../'), '');
  return `/uploads${relativePath.split('uploads')[1]}`.replace(/\\/g, '/');
}

// Helper function to delete file
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Upload Middleware] Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`[Upload Middleware] Error deleting file: ${filePath}`, error);
  }
}

// Cleanup old files (can be called periodically)
export function cleanupOldFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  
  function cleanDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && (now - stats.mtimeMs) > maxAgeMs) {
        deleteFile(filePath);
      } else if (stats.isDirectory()) {
        cleanDirectory(filePath);
      }
    });
  }
  
  cleanDirectory(UPLOAD_DIR);
  console.log(`[Upload Middleware] Cleaned up old files older than ${maxAgeMs / 1000 / 60 / 60 / 24} days`);
}

// Export upload directory path
export const UPLOAD_DIRECTORY = UPLOAD_DIR;

