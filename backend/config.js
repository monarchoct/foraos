// HEART Backend Configuration

export const config = {
    // Server Configuration
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    
    // Solana Configuration
    SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet', // 'mainnet-beta', 'devnet', 'testnet'
    REQUIRED_TOKEN_MINT: process.env.REQUIRED_TOKEN_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on devnet
    MIN_TOKEN_BALANCE: process.env.MIN_TOKEN_BALANCE || 1, // Minimum token balance required
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
    
    // Database
    DATABASE_PATH: process.env.DATABASE_PATH || './data/heart.db'
};

// Available networks and their default tokens
export const NETWORK_CONFIGS = {
    'devnet': {
        name: 'Solana Devnet',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC Devnet
        minBalance: 1,
        description: 'Development network for testing'
    },
    'mainnet-beta': {
        name: 'Solana Mainnet',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC Mainnet
        minBalance: 1,
        description: 'Production network'
    },
    'testnet': {
        name: 'Solana Testnet',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC Testnet
        minBalance: 1,
        description: 'Test network'
    }
}; 