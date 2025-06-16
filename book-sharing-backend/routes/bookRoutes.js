const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateUserOrAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ... existing routes ...

// Get file size
router.get('/:bookId/file-size/:versionLabel', authenticateUserOrAdmin, async (req, res) => {
  try {
    const { bookId, versionLabel } = req.params;
    console.log('Getting file size for book:', bookId, 'version:', versionLabel);
    
    // Get the version details to find the file path
    const version = await bookController.getVersionByLabel(bookId, versionLabel);
    console.log('Version details:', version);

    if (!version) {
      console.log('Version not found for book:', bookId, 'version:', versionLabel);
      return res.status(404).json({ error: 'Version not found' });
    }

    if (!version.file_path) {
      console.log('File path not found in version:', version);
      return res.status(404).json({ error: 'File path not found' });
    }

    // Construct the full file path
    const filePath = path.join(__dirname, '..', 'uploads', 'books', version.file_path);
    console.log('Looking for file at:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      // Try alternative path
      const altPath = path.join(__dirname, '..', 'uploads', version.file_path);
      console.log('Trying alternative path:', altPath);
      
      if (fs.existsSync(altPath)) {
        console.log('File found at alternative path');
        const stats = fs.statSync(altPath);
        console.log('File size:', stats.size);
        return res.json({ size: stats.size });
      }
      
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size);
    
    res.json({ size: stats.size });
  } catch (error) {
    console.error('Error getting file size:', error);
    // Send more detailed error information
    res.status(500).json({ 
      error: 'Error getting file size',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 