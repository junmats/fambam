# Photo Storage Migration Guide

## Current Issue
Photos are stored locally in `server/uploads/photos/` which won't work in production with Vercel + Railway.

## Recommended Solution: Cloudinary

### Benefits:
- ✅ Built specifically for image storage and optimization
- ✅ Automatic image transformations and optimization
- ✅ Global CDN for fast loading
- ✅ Generous free tier (25GB storage, 25GB bandwidth/month)
- ✅ Easy integration with existing multer setup

### Implementation Steps:

1. **Install Cloudinary SDK**
   ```bash
   cd server && npm install cloudinary
   ```

2. **Set up environment variables**
   Add to Railway environment:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Update photo upload route** to use Cloudinary instead of local storage

4. **Update frontend URLs** to use dynamic API URL instead of localhost

### Alternative Solutions:

#### AWS S3 + CloudFront
- More complex setup but industry standard
- Requires AWS account and configuration

#### Railway Volumes
- Minimal code changes
- Add persistent volume to Railway service
- Update file paths to use volume mount point

### Migration Strategy:
1. Implement new storage system
2. Keep existing photos accessible during transition
3. Optional: Migrate existing photos to new storage
