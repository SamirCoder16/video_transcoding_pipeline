import { fileTypeFromBuffer } from "file-type";

const validateFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024;

    // Size validation
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: "File size must be less than or equal to 100MB",
      });
    }

    // Actual file signature validation
    const fileType = await fileTypeFromBuffer(req.file.buffer);

    if (!fileType || fileType.mime !== "video/mp4") {
      return res.status(400).json({
        success: false,
        message: "Only valid MP4 files are allowed",
      });
    }

    next();
  } catch (error) {
    console.error("File validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default validateFile;
