// Aria Nexa Secure Backend API - v2.1 Rate Limit Fix
// Updated: May 2026
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, userMessage, useWebSearch } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage required' });
    }

    // Get API key from environment
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured',
        help: 'Add ANTHROPIC_API_KEY to Vercel/Render environment variables'
      });
    }

    // Build request with CORRECT MODEL
    const body = {
      model: 'claude-sonnet-4-6',  // Updated to May 2026 model
      max_tokens: 4096,
      messages: [{ role: 'user', content: userMessage }]
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    // Enable web search with correct 2026 tool type
    if (useWebSearch) {
      body.tools = [{ 
        type: "web_search_20260209", 
        name: "web_search" 
      }];
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
      
      // Log rate limit errors for debugging
      if (response.status === 429) {
        console.error('⚠ 429 Rate Limit Hit:', error);
      }
      
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

    return res.status(200).json({
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
};
