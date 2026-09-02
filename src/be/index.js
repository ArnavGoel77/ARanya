require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import feature routers
const chatRouter = require('./routes/chat/chat-router');
const locationRouter = require('./routes/location/location-router');
const visionRouter = require('./routes/vision/vision_router');
const plantsRouter = require('./routes/plants/plants_router');
const usersRouter = require('./routes/users/users-router');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so your React frontend (port 5173/3000) can talk to Express (port 5000)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Mount backend feature routes under API endpoints
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/location', locationRouter);
app.use('/api/v1/vision', visionRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/users', usersRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('ARanya Backend API is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Export the Express app for Vercel Serverless Functions
module.exports = app;