#!/usr/bin/env node

/**
 * Quick start script for Twitter Backend Service
 * Sets environment variables and starts the server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables for Twitter
process.env.PORT = process.env.PORT || '3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_PATH = process.env.DATABASE_PATH || './data/heart.db';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '100';
process.env.SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
process.env.REQUIRED_TOKEN_MINT = process.env.REQUIRED_TOKEN_MINT || 'your-token-mint-address-here';
process.env.MIN_TOKEN_BALANCE = process.env.MIN_TOKEN_BALANCE || '1';

// Twitter credentials
process.env.TWITTER_USERNAME = process.env.TWITTER_USERNAME || 'mimicosx';
process.env.TWITTER_PASSWORD = process.env.TWITTER_PASSWORD || 'mimic123!';
process.env.TWITTER_EMAIL = process.env.TWITTER_EMAIL || 'mimicos792@gmail.com';

console.log('🤖 Starting HEART Backend with Twitter Puppeteer Service...');
console.log('🐦 Twitter Username:', process.env.TWITTER_USERNAME);
console.log('📧 Twitter Email:', process.env.TWITTER_EMAIL);
console.log('🌐 Port:', process.env.PORT);
console.log('');

// Start the server
const serverPath = join(__dirname, 'server.js');
const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env
});

server.on('close', (code) => {
    console.log(`\n🔴 Server process exited with code ${code}`);
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
});
