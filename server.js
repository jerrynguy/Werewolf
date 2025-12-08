import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware: Validate API key
const validateApiKey = (req, res, next) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OPENAI_API_KEY not configured in .env file' 
    });
  }
  next();
};

// Middleware: Validate request body
const validateAIRequest = (req, res, next) => {
  const { model, messages } = req.body;
  
  if (!model) {
    return res.status(400).json({ error: 'Missing required field: model' });
  }
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
  }
  
  // Validate message structure
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ 
        error: 'Invalid message format. Each message must have role and content' 
      });
    }
  }
  
  next();
};

app.post('/api/ai-decision', validateApiKey, validateAIRequest, async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API Error:', errorData);
      
      return res.status(response.status).json({
        error: 'OpenAI API Error',
        details: errorData,
        statusCode: response.status
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cannot connect to OpenAI API',
        details: 'Service unavailable' 
      });
    }
    
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout',
        details: 'The AI request took too long' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});