import 'dotenv/config';
import express from 'express';
import handler from './api/chat.js';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.all('/api/chat', handler);
app.listen(3001, () => console.log('API running on port 3001'));