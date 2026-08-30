import express from "express";
import morgan from "morgan";
import validateFile from "./middleware/validatefile.js";
import upload from "./middleware/multer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import crypto from "crypto";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello world");
});

// this route is for upload files
app.post("/api/v1/upload", upload.single("video"), validateFile, (req, res) => {
  const media = req.file;
  if (!media) {
    return res.status(400).json({
      success: false,
      message: "Please provide a media file",
    });
  }
  // then save into the inside storage folder original folder with the original name of the file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const storagePath = path.join(__dirname, "storage", "original");
  // create the storage folder if it doesn't exist
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  // save the file under storage/original folder
  const filePath = path.join(storagePath, media.originalname);
  fs.writeFileSync(filePath, media.buffer);

  const video = {
    id: crypto.randomUUID(),
    name: media.originalname,
    path: filePath,
    path: storagePath,
    mimeType: req.file.mimetype,
    size: req.file.size,
    status: "UPLOADED",
  };
  
  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    filePath: filePath,
    video: video,
  });
});

export default app;
