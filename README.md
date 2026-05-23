 # StreamVibe Backend API 🚀

REST API for StreamVibe video streaming application.

## Live URL
https://streamvibe-server.onrender.com

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary
- Multer

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/follow/:id

### Videos
- GET /api/videos
- POST /api/videos
- GET /api/videos/search
- GET /api/videos/history
- POST /api/videos/:id/like
- POST /api/videos/:id/comment
- POST /api/videos/:id/watch
- DELETE /api/videos/:id
