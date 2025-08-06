#!/bin/bash

# Railway Photo Migration Script
# This script helps migrate existing photos to Railway volumes

echo "🚂 Railway Photo Storage Migration"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current photos found:"
if [ -d "server/uploads/photos" ]; then
    photo_count=$(ls -1 server/uploads/photos/*.jpg 2>/dev/null | wc -l)
    echo "   📸 $photo_count photos in server/uploads/photos/"
    if [ $photo_count -gt 0 ]; then
        echo "   Photos to migrate:"
        ls -la server/uploads/photos/*.jpg | awk '{print "     " $9 " (" $5 " bytes)"}'
    fi
else
    echo "   📂 No existing photos directory found"
fi

echo ""
echo "🔧 Railway Volume Setup Instructions:"
echo "====================================="
echo ""
echo "1. 📋 In Railway Dashboard:"
echo "   • Go to your FamBam service"
echo "   • Click on 'Variables' tab"
echo "   • Add environment variable:"
echo "     RAILWAY_VOLUME_MOUNT_PATH=/app/data"
echo ""
echo "2. 💾 Add Persistent Volume:"
echo "   • Go to 'Settings' tab in Railway"
echo "   • Scroll to 'Volumes' section"
echo "   • Click 'Add Volume'"
echo "   • Mount Path: /app/data"
echo "   • Size: 1GB (should be plenty for family photos)"
echo ""
echo "3. 🚀 Deploy Updated Code:"
echo "   • The server is already updated to use Railway volumes"
echo "   • Deploy your changes to Railway"
echo ""
echo "4. 📤 Upload Existing Photos:"
echo "   • After Railway volume is set up, you can:"
echo "   • Option A: Re-upload photos through the app (recommended)"
echo "   • Option B: Use Railway CLI to copy files directly"
echo ""

if [ $photo_count -gt 0 ]; then
    echo "5. 🔄 Migration Options for Existing Photos:"
    echo ""
    echo "   Option A - Re-upload through app (Recommended):"
    echo "   • Photos will be automatically optimized"
    echo "   • Ensures proper integration with new system"
    echo "   • $photo_count photos to re-upload"
    echo ""
    echo "   Option B - Railway CLI transfer:"
    echo "   • Install Railway CLI: npm install -g @railway/cli"
    echo "   • railway login"
    echo "   • railway shell"
    echo "   • Then copy files manually"
fi

echo ""
echo "📝 Code Changes Made:"
echo "==================="
echo "✅ server/index.js - Updated to use photos-railway routes"
echo "✅ server/routes/photos-railway.js - Railway volume support"
echo "✅ client/src/components/PhotoUpload.tsx - Dynamic API URLs"
echo "✅ client/src/pages/Dashboard.tsx - Fixed photo URL handling"
echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. Set up Railway volume (steps above)"
echo "2. Deploy to Railway"
echo "3. Test photo upload in production"
echo "4. Re-upload existing photos through the app"
echo ""
echo "💡 Volume Benefits:"
echo "=================="
echo "✅ Photos persist across deployments"
echo "✅ No external dependencies"
echo "✅ Simple Railway-native solution"
echo "✅ Automatic backup with Railway"
echo ""
echo "🚨 Important Notes:"
echo "=================="
echo "• Make sure RAILWAY_VOLUME_MOUNT_PATH=/app/data is set"
echo "• Volume must be mounted to /app/data"
echo "• Photos will be stored in /app/data/photos/"
echo "• Test thoroughly before removing local photos"
