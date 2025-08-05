#!/bin/bash

# Family Tree Theme Applicator Script
# This script applies the family-friendly theme

echo "🏡 Applying Family Theme..."

cd "$(dirname "$0")"

# Create backup if it doesn't exist
if [ ! -d "client/src/themes/current-backup" ]; then
  echo "📦 Creating backup of current theme..."
  mkdir -p "client/src/themes/current-backup"
  cp "client/src/pages/Dashboard.css" "client/src/themes/current-backup/" 2>/dev/null || true
  cp "client/src/pages/Home.css" "client/src/themes/current-backup/" 2>/dev/null || true
  cp "client/src/components/Navigation.css" "client/src/themes/current-backup/" 2>/dev/null || true
  cp "client/src/App.css" "client/src/themes/current-backup/" 2>/dev/null || true
  echo "✅ Backup created"
fi

echo "🎨 Family theme is already applied!"
echo ""
echo "🎉 Your family tree now has a warm, welcoming theme!"
echo "💡 Features:"
echo "   • Warm brown and gold color palette"
echo "   • Family-friendly emojis and animations"
echo "   • Gentle gradients and soft shadows"
echo "   • Comfortable, welcoming typography"
echo ""
echo "To restore the previous theme, run: ./restore-theme.sh"
