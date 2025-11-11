// Script to generate extension icons using Canvas API
// Run this in a browser console or Node.js with canvas package

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, color, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Draw JSON-LD symbol (simplified brackets and dots)
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{}', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'icons', filename), buffer);
  console.log(`Created ${filename}`);
}

// Create active icons (green)
createIcon(16, '#28a745', 'icon-active-16.png');
createIcon(32, '#28a745', 'icon-active-32.png');
createIcon(48, '#28a745', 'icon-active-48.png');
createIcon(128, '#28a745', 'icon-active-128.png');

// Create inactive icons (gray)
createIcon(16, '#6c757d', 'icon-inactive-16.png');
createIcon(32, '#6c757d', 'icon-inactive-32.png');
createIcon(48, '#6c757d', 'icon-inactive-48.png');
createIcon(128, '#6c757d', 'icon-inactive-128.png');

// Create default icons (purple)
createIcon(16, '#667eea', 'icon-16.png');
createIcon(32, '#667eea', 'icon-32.png');
createIcon(48, '#667eea', 'icon-48.png');
createIcon(128, '#667eea', 'icon-128.png');

console.log('All icons created successfully!');
