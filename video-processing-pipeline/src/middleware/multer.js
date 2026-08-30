import multer from "multer";

const storage = multer.memoryStorage(); // memory storage me req.file.buffer milega .

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["video/mp4"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only video files are allowed", false));
  }

  cb(null, true); // this means the file is accepted and will be stored in memory
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export default upload;
