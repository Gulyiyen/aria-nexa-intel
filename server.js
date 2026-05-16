const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoint
app.post('/api/claude', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { systemPrompt, userMessage, useWebSearch } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage required' });
    }

    const API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userMessage }]
    };

    if (systemPrompt) body.system = systemPrompt;

    if (useWebSearch) {
      body.tools = [{ 
        type: "web_search_20260209", 
        name: "web_search" 
      }];
    }

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
      if (response.status === 429) {
        console.error('⚠ 429 Rate Limit:', error);
      }
      return res.status(response.status).json({ 
        error: 'API error', 
        details: error 
      });
    }

    const data = await response.json();
    
    let text = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') text += block.text + '\n';
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

// Health check
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Aria Nexa Intelligence running on port ${PORT}`);
  console.log(`API_KEY exists: ${!!process.env.ANTHROPIC_API_KEY}`);
});
