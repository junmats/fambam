#!/bin/bash

# Photo Storage Migration Setup Script
# This script helps set up Cloudinary for photo storage in production

echo "🚀 Setting up Cloudinary for FamBam Photo Storage"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing Cloudinary SDK..."
cd server
npm install cloudinary
cd ..

echo "✅ Cloudinary SDK installed!"

echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Create a Cloudinary account at https://cloudinary.com (free tier available)"
echo ""
echo "2. Add these environment variables to your Railway deployment:"
echo "   CLOUDINARY_CLOUD_NAME=your_cloud_name"
echo "   CLOUDINARY_API_KEY=your_api_key" 
echo "   CLOUDINARY_API_SECRET=your_api_secret"
echo ""
echo "3. Update your server to use the new Cloudinary routes:"
echo "   - Replace 'routes/photos.js' with 'routes/photos-cloudinary.js'"
echo "   - Or rename photos-cloudinary.js to photos.js"
echo ""
echo "4. Deploy to Railway with the new environment variables"
echo ""
echo "5. Test photo upload in production"
echo ""
echo "💡 Benefits of this migration:"
echo "   ✅ Photos will persist across deployments"
echo "   ✅ Global CDN for faster loading"
echo "   ✅ Automatic image optimization"
echo "   ✅ No storage limits on Railway"
echo ""
echo "🔧 For local development:"
echo "   Add the same environment variables to server/.env"
echo "   Photos will be uploaded to Cloudinary even in development"
echo ""
echo "📄 See PHOTO_STORAGE_MIGRATION.md for detailed instructions"
