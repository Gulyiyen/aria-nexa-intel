// Aria Nexa Intelligence Backend for Railway
// Updated: May 3, 2026 - Added dotenv support
require('dotenv').config(); // Load .env variables
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Aria Nexa Intelligence API - Online' });
});

// Claude API endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { systemPrompt, userMessage, useWebSearch } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage required' });
    }

    const API_KEY = process.env.ANTHROPIC_API_KEY;
    
    // DEBUG: Log environment info
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('API_KEY exists:', !!API_KEY);
    console.log('API_KEY length:', API_KEY ? API_KEY.length : 0);
    console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC')));
    console.log('========================');
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured',
        help: 'Add ANTHROPIC_API_KEY to Railway environment variables'
      });
    }

    // Final Corrected 2026 Build Request
    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userMessage }],
      tools: useWebSearch ? [
        { 
          type: "web_search_20260209", 
          name: "web_search" 
        }
      ] : []
    };

    // Add the system prompt if it exists
    if (systemPrompt) {
      body.system = systemPrompt;
    }
    // Call Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: 'Anthropic API error', 
        details: error 
      });
    }

    const data = await response.json();
    
    // Extract text from response
    let text = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          text += block.text + '\n';
        }
      }
    }

    return res.json({
      success: true,
      response: text.trim() || 'No response',
      usage: data.usage
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aria Nexa Intelligence API running on port ${PORT}`);
});
