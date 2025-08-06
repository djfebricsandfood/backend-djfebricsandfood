const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const THUMBNAIL_MAX_SIZE = 80 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const THUMBNAIL_WIDTH = 300;
const UPLOADS_BASE_PATH = './public/uploads';

// Supported image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const generateRandomString = () => crypto.randomBytes(5).toString('hex').slice(0, 10);

const generateFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase().slice(1);
  const randomStr = generateRandomString();
  const timestamp = Date.now();
  return `${randomStr}-${timestamp}.${ext}`;
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    let uploadPath;
    const route = req.route?.path || req.url || '';
    
    if (route.includes('/blog') || (route.includes('/blog') && file.fieldname === 'image')) {
      uploadPath = path.join(UPLOADS_BASE_PATH, 'blogs');
    } else if (route.includes('/carousel') || route.includes('/hero') || (file.fieldname === 'image' && route.includes('/carousel'))) {
      uploadPath = path.join(UPLOADS_BASE_PATH, 'carousel');
    } else if (file.fieldname === 'image') {
      // Generic image upload - determine by route
      if (route.includes('/blog')) {
        uploadPath = path.join(UPLOADS_BASE_PATH, 'blogs');
      } else if (route.includes('/carousel') || route.includes('/hero')) {
        uploadPath = path.join(UPLOADS_BASE_PATH, 'carousel');
      } else {
        uploadPath = path.join(UPLOADS_BASE_PATH, 'general');
      }
    } else if (file.fieldname === 'images') {
      uploadPath = path.join(UPLOADS_BASE_PATH, 'products/main');
    } else if (file.fieldname === 'subProducts' || file.fieldname.startsWith('subProducts[')) {
      uploadPath = path.join(UPLOADS_BASE_PATH, 'products/sub');
    } else {
      // Default to main if fieldname is unclear
      uploadPath = path.join(UPLOADS_BASE_PATH, 'products/main');
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  console.log('Processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  req.fileValidationError = `Invalid image type. Only ${ALLOWED_IMAGE_TYPES.join(', ')} are allowed.`;
  return cb(null, false);
};

const uploadProductImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 20 
  }
}).any(); 

const handleMulterUpload = (req, res, next) => {
  uploadProductImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      
      if (err.code === 'UNEXPECTED_FIELD' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: `Unexpected field '${err.field}'. Make sure you're using correct field names.`,
          receivedField: err.field
        });
      }
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File size too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    if (err) {
      console.error('Upload Error:', err);
      return res.status(500).json({
        success: false,
        message: 'File upload failed'
      });
    }
    
    // Handle file validation errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    if (req.files && Array.isArray(req.files)) {
      const organizedFiles = {
        images: [],
        subProducts: []
      };
      
      req.files.forEach(file => {
        console.log('Organizing file:', file.fieldname, file.originalname);
        
        if (file.fieldname === 'images' || file.fieldname === 'image') {
          organizedFiles.images.push(file);
        } else if (file.fieldname === 'subProducts' || file.fieldname.startsWith('subProducts[')) {
          organizedFiles.subProducts.push(file);
        }
      });
      
      // Replace req.files with organized structure
      req.files = organizedFiles;
      console.log('Organized files:', {
        images: organizedFiles.images.length,
        subProducts: organizedFiles.subProducts.length
      });
    }
    
    next();
  });
};

module.exports = {
  uploadProductImages,
  handleMulterUpload
};