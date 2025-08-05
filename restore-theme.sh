#!/bin/bash

# Family Tree Theme Restore Script
# This script restores the previous theme if you don't like the new family-friendly theme

echo "🔄 Restoring previous theme..."

cd "$(dirname "$0")"

# Check if backup directory exists
if [ ! -d "client/src/themes/current-backup" ]; then
  echo "❌ Backup directory not found!"
  echo "Cannot restore previous theme."
  exit 1
fi

# Restore CSS files
echo "📂 Restoring CSS files..."

if [ -f "client/src/themes/current-backup/Dashboard.css" ]; then
  cp "client/src/themes/current-backup/Dashboard.css" "client/src/pages/"
  echo "✅ Dashboard.css restored"
fi

if [ -f "client/src/themes/current-backup/Home.css" ]; then
  cp "client/src/themes/current-backup/Home.css" "client/src/pages/"
  echo "✅ Home.css restored"
fi

if [ -f "client/src/themes/current-backup/Navigation.css" ]; then
  cp "client/src/themes/current-backup/Navigation.css" "client/src/components/"
  echo "✅ Navigation.css restored"
fi

if [ -f "client/src/themes/current-backup/App.css" ]; then
  cp "client/src/themes/current-backup/App.css" "client/src/"
  echo "✅ App.css restored"
fi

echo ""
echo "🎉 Previous theme restored successfully!"
echo "💡 You may need to refresh your browser to see the changes."
echo ""
echo "To switch back to the family theme, run: npm run theme:family"
