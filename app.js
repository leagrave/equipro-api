
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user_routes');
const authRoutes = require('./routes/auth_routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;

