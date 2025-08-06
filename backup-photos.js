const fs = require('fs').promises;
const path = require('path');

async function backupPhotos() {
  console.log('📸 FamBam Photo Backup Utility');
  console.log('==============================');
  
  const sourceDir = path.join(__dirname, 'server/uploads/photos');
  const backupDir = path.join(__dirname, 'photo-backup');
  
  try {
    // Check if source directory exists
    const sourceExists = await fs.access(sourceDir).then(() => true).catch(() => false);
    if (!sourceExists) {
      console.log('❌ No photos directory found at:', sourceDir);
      return;
    }
    
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });
    console.log('📁 Created backup directory:', backupDir);
    
    // Get list of photos
    const files = await fs.readdir(sourceDir);
    const photos = files.filter(file => file.endsWith('.jpg'));
    
    console.log(`📊 Found ${photos.length} photos to backup`);
    
    if (photos.length === 0) {
      console.log('✅ No photos to backup');
      return;
    }
    
    // Copy each photo
    let copied = 0;
    for (const photo of photos) {
      try {
        const sourcePath = path.join(sourceDir, photo);
        const backupPath = path.join(backupDir, photo);
        
        await fs.copyFile(sourcePath, backupPath);
        console.log(`📋 Copied: ${photo}`);
        copied++;
      } catch (error) {
        console.error(`❌ Failed to copy ${photo}:`, error.message);
      }
    }
    
    console.log('');
    console.log('✅ Backup completed!');
    console.log(`📈 Successfully backed up ${copied}/${photos.length} photos`);
    console.log(`📂 Backup location: ${backupDir}`);
    console.log('');
    console.log('🔄 Next steps:');
    console.log('1. Set up Railway volume');
    console.log('2. Deploy updated code');
    console.log('3. Re-upload photos through the app');
    console.log('4. Verify photos work in production');
    console.log('5. Delete backup after successful migration');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

// Run the backup
backupPhotos().catch(console.error);
