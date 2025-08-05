const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Switch theme endpoint
router.post('/switch', async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme || !['family', 'original'].includes(theme)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid theme. Must be "family" or "original".' 
      });
    }

    const scriptName = theme === 'original' ? 'theme:restore' : 'theme:family';
    const workspaceRoot = path.resolve(__dirname, '../..');
    
    // Run the npm script
    const npmProcess = spawn('npm', ['run', scriptName], {
      cwd: workspaceRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    npmProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    npmProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ 
          success: true, 
          message: `Theme switched to ${theme}`,
          theme: theme
        });
      } else {
        console.error('Theme switch error:', stderr);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to switch theme',
          error: stderr
        });
      }
    });

    npmProcess.on('error', (error) => {
      console.error('Theme switch process error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start theme switch process',
        error: error.message
      });
    });

  } catch (error) {
    console.error('Theme switch endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get current theme
router.get('/current', (req, res) => {
  // Since we can't easily detect the current theme from the server,
  // we'll rely on the client to manage this state
  res.json({ 
    success: true,
    message: 'Theme state should be managed on the client side'
  });
});

module.exports = router;
