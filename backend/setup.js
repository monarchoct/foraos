#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 HEART Backend Setup');
console.log('======================\n');

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
} else {
    console.log('✅ Data directory already exists');
}

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found. Please run: npm install');
    process.exit(1);
}

console.log('\n📦 Installing dependencies...');
console.log('Run: cd backend && npm install');

    console.log('\nConfiguration:');
console.log('- Default Network: Devnet');
console.log('- Required Token: USDC (Devnet)');
console.log('- Minimum Balance: 1 USDC');
console.log('- Server Port: 3001');

console.log('\n🌐 To get USDC on Devnet:');
console.log('1. Visit: https://solfaucet.com/');
console.log('2. Select "Devnet"');
console.log('3. Request USDC tokens');
console.log('4. Add to your Phantom wallet');

console.log('\n🚀 To start the server:');
console.log('cd backend && npm run dev');

console.log('\n🔗 Frontend will connect to: http://localhost:3001');

console.log('\n📝 Environment Variables (optional):');
console.log('PORT=3001');
console.log('JWT_SECRET=your-secret-key');
console.log('SOLANA_NETWORK=devnet');
console.log('REQUIRED_TOKEN_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
console.log('MIN_TOKEN_BALANCE=1');

console.log('\n✅ Setup complete!'); 