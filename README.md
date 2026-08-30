# Video Processing Pipeline

This project is a simple video-processing backend built with Node.js and Express. It accepts an uploaded MP4 file, validates it, stores it in the local storage folder, and prepares the project for further ffmpeg-based processing.

## Pipeline Overview

The general workflow of the application is:

1. A client uploads a video file through the API.
2. The server uses Multer to receive the file in memory.
3. The file is validated to ensure:
   - a file was actually uploaded
   - the file size is not larger than 100MB
   - the file is a valid MP4 file
4. The file is saved to the original storage directory.
5. The ffmpeg container can be used to process the video further and save the result in the processed storage directory.

This project currently covers the upload and validation stage, and it includes Docker support for ffmpeg so the pipeline can be extended easily.

## Suggested Production-Grade Architecture (AWS + Node.js)

For a real production system, this project can be evolved into a scalable cloud pipeline using AWS services and a Node.js backend.

### Recommended architecture

1. Client uploads a video through a secure API endpoint.
2. The Node.js API service receives the upload and validates the file.
3. Large files are uploaded directly to Amazon S3 using presigned URLs to reduce server load.
4. A metadata event is published to an SQS queue or SNS topic after upload succeeds.
5. A background worker service, running Node.js with ffmpeg on ECS/Fargate or EC2, picks up the job.
6. The worker transcodes the video, creates thumbnails, creates adaptive bitrate renditions, and stores processed output in a processed S3 bucket.
7. Metadata is saved in DynamoDB or PostgreSQL, including status, filename, original URL, processed URL, and timestamps.
8. Final video files are served through CloudFront for fast delivery.
9. Monitoring, dashboards, and alerts are handled with CloudWatch and X-Ray.

### Example AWS stack

- API layer: API Gateway or Application Load Balancer
- Backend: Node.js (Express or NestJS) on ECS Fargate or EC2
- Storage: Amazon S3 for original and processed media
- Message queue: SQS for video job processing
- Processing workers: Node.js + ffmpeg containers on ECS/Fargate
- Metadata DB: DynamoDB or PostgreSQL
- Caching / job tracking: Redis or ElastiCache
- CDN: CloudFront
- Monitoring: CloudWatch, CloudTrail, X-Ray
- Security: IAM roles, bucket policies, WAF, TLS, Cognito or JWT auth

### Production pipeline flow

```text
Client
  -> API Gateway / ALB
  -> Node.js API
  -> Validate file
  -> Upload to S3
  -> Publish event to SQS
  -> Video worker (Node.js + ffmpeg)
  -> Generate processed versions
  -> Save output to S3
  -> Update DB metadata
  -> Serve through CloudFront
```

### Why this is production-ready

- Scales horizontally with multiple API and worker instances
- Handles large video uploads without overloading the app server
- Decouples upload handling from heavy media processing
- Provides reliability using queues and retries
- Uses object storage for large video files
- Enables monitoring, traceability, and operational observability

### Suggested implementation pattern

Use the following design for a robust deployment:

- API service: accepts upload requests and stores metadata
- Worker service: consumes SQS jobs and runs ffmpeg commands
- Storage strategy: keep original videos in one bucket and processed outputs in another
- Processing jobs: queue tasks like transcode, resize, generate preview, create HLS streams
- Status tracking: `QUEUED -> PROCESSING -> DONE -> FAILED`

### Example technology stack

```text
Node.js + Express
AWS S3
AWS SQS
AWS ECS Fargate
ffmpeg
DynamoDB / PostgreSQL
CloudFront
CloudWatch
Redis
```

This architecture gives you a modern media pipeline that is scalable, fault-tolerant, and suitable for production workloads.

## Project Structure

```bash
video-processing-pipeline/
├── docker-compose.yml
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── middleware/
│   │   ├── multer.js
│   │   └── validatefile.js
│   └── storage/
│       ├── original/
│       └── processed/
└── README.md
```

## How the Code Works

### 1. Server setup
The app starts in `src/server.js` and listens on port `3000` by default.

### 2. Upload route
The main upload endpoint is:

```bash
POST /api/v1/upload
```

This route:
- accepts a multipart form field named `video`
- allows only MP4 files
- checks maximum file size
- validates the actual file signature using `file-type`
- saves the file into the original storage folder

### 3. Validation layer
The validation logic is in `src/middleware/validatefile.js`.

It checks:
- `req.file` exists
- size <= 100MB
- file type matches `video/mp4`

### 4. Storage
Uploaded videos are saved under:

```bash
src/storage/original/
```

Processed files are intended to be placed in:

```bash
src/storage/processed/
```

### 5. FFmpeg container
The Docker setup in `docker-compose.yml` starts an `ffmpeg` container using the `jrottenberg/ffmpeg` image. This is useful for adding processing steps like:
- resizing
- trimming
- compressing
- converting formats
- extracting frames

---

## Prerequisites

Before running the project, make sure you have installed:

- Node.js (recommended: v18+)
- npm
- Docker Desktop or Docker Engine (optional but recommended for ffmpeg)

---

## How to Run the Project

### Option 1: Run the backend locally

From the project root:

```bash
cd video-processing-pipeline
npm install
npm run dev
```

The server will start on:

```bash
http://localhost:3000
```

### Option 2: Run the ffmpeg container with Docker

From the project root:

```bash
cd video-processing-pipeline
docker compose up -d
```

This starts the `ffmpeg` container defined in `docker-compose.yml`.

---

## Upload a Video

Use a form or curl to send a video file.

### Example with curl

```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "video=@/path/to/your/video.mp4"
```

Example response:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "filePath": "C:/.../src/storage/original/video.mp4",
  "video": {
    "id": "...",
    "name": "video.mp4",
    "mimeType": "video/mp4",
    "size": 123456,
    "status": "UPLOADED"
  }
}
```

---

## Full Pipeline Concept

The intended pipeline for this project is:

1. User uploads MP4 to the API.
2. Backend validates the file.
3. Original file is stored in `src/storage/original`.
4. ffmpeg processes the file.
5. Processed output is written to `src/storage/processed`.
6. The final video is available for downstream use.

This makes the project scalable for any future video transformation tasks.

---

## Notes

- The current app only implements the upload and validation stage.
- You can extend the pipeline by adding background processing jobs or ffmpeg commands after the upload step.
- This project is a good starting point for building a real media-processing service.

## Quick Start Summary

```bash
cd video-processing-pipeline
npm install
npm run dev
```

Then upload a file to:

```bash
http://localhost:3000/api/v1/upload
```

If you want to use ffmpeg as part of the pipeline, also run:

```bash
docker compose up -d
```
