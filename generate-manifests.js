#!/usr/bin/env node

/**
 * Photo Gallery Manifest Generator (ES Module version)
 * 
 * This script automatically scans your photo folders and creates
 * manifest.json files for each category. Run this whenever you
 * add new photos to automatically update your gallery!
 * 
 * Usage: node generate-manifests.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageSizeFromFile, setConcurrency } from 'image-size/fromFile'
setConcurrency(123456)


// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PHOTOS_DIR = './public/photos';
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const RECURSIVE = true; // Set to false to disable subcategory scanning

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_FORMATS.includes(ext);
}

async function generateManifest(categoryPath, categoryName) {
  try {
    // Read all files in the category folder
    const files = fs.readdirSync(categoryPath);
    let photos = []
    // Filter for image files only
    for (const file of files) {
      try {
        // log("file: " + file);
        const filePath = path.join(categoryPath, file);
        if (fs.statSync(filePath).isFile() && isImageFile(file)) {
          const { width, height, orientation } = await imageSizeFromFile(filePath);
        //   console.log(width, height, orientation);
          photos.push([filePath.slice(6), file.slice(0, file.lastIndexOf('.')), width, height, orientation]);
        }
      } catch (err) {
        log(`  ✗ Failed to read ${file}: ${err.message}`, 'yellow');
      }
    }
    //   .sort(); // Sort alphabetically for consistency
    
    if (photos.length === 0) {
      log(`  ⚠️  No photos found in ${categoryName}`, 'yellow');
      return false;
    }
    
    // Look for a file named 'thumbnail' or use first photo
    const thumbnail = photos.find(p => {
      const fname = p[0].toLowerCase();
      return fname.includes('thumbnail') || fname.includes('cover');
    }) || photos[0];
    
    // Create manifest object
    const manifest = {
      thumbnail: thumbnail,
      photos: photos,
      count: photos.length,
      generated: new Date().toISOString()
    };
    
    // Write manifest.json to category folder
    const manifestPath = path.join(categoryPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    log(`  ✓ Generated manifest for ${categoryName} (${photos.length} photos)`, 'green');
    return true;
    
  } catch (error) {
    log(`  ✗ Error processing ${categoryName}: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n📸 Photo Gallery Manifest Generator\n', 'blue');
  
  // Check if photos directory exists
  if (!fs.existsSync(PHOTOS_DIR)) {
    log(`Error: Photos directory not found at ${PHOTOS_DIR}`, 'red');
    log('Please create the directory and add your photo categories.', 'yellow');
    process.exit(1);
  }
  
  let successCount = 0;
  let totalFolders = 0;
  
  function scanDirectory(dir, depth = 0) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        const relativePath = path.relative(PHOTOS_DIR, itemPath);
        
        // Check if this folder has photos
        const files = fs.readdirSync(itemPath);
        const hasPhotos = files.some(f => {
          const fp = path.join(itemPath, f);
          return fs.statSync(fp).isFile() && isImageFile(f);
        });
        
        if (hasPhotos) {
          totalFolders++;
          if (generateManifest(itemPath, relativePath)) {
            successCount++;
          }
        }
        
        // Recursively scan subdirectories if enabled
        if (RECURSIVE) {
          scanDirectory(itemPath, depth + 1);
        }
      }
    });
  }
  
  log('Scanning for photo folders...\n', 'blue');
  scanDirectory(PHOTOS_DIR);
  
  if (totalFolders === 0) {
    log('No photo folders found in ./public/photos/', 'yellow');
    log('Create folders and add images like:', 'yellow');
    log('  ./public/photos/birds/photo1.jpg', 'yellow');
    log('  ./public/photos/birds/raptors/eagle.jpg', 'yellow');
    process.exit(1);
  }
  
  log(`\n✨ Complete! Generated ${successCount}/${totalFolders} manifests\n`, 'green');
  
  if (successCount < totalFolders) {
    log('Some folders had issues. Check the warnings above.', 'yellow');
  }
  
  log('You can now run your gallery with: npm run dev\n', 'blue');
}

// Run the script
main();