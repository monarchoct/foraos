import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Server-side Twitter Automation Service
 * Based on Eliza's approach - runs in Node.js environment
 */
export class TwitterService {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        this.isMonitoring = false;
        this.credentials = {
            username: process.env.TWITTER_USERNAME,
            password: process.env.TWITTER_PASSWORD,
            email: process.env.TWITTER_EMAIL
        };
        
        // Session management
        this.sessionPath = './temp/twitter-session.json';
        this.processedMentions = new Set();
        this.processedComments = new Set();
        
        // Monitoring intervals
        this.mentionInterval = null;
        this.streamInterval = null;
        
        // Event callbacks (will be set by server endpoints)
        this.onMentionFound = null;
        this.onStreamComment = null;
    }

    async initialize() {
        console.log('🤖 Initializing Twitter Service (Server-side)...');
        
        if (!this.credentials.username || !this.credentials.password) {
            throw new Error('Twitter credentials not found in environment variables');
        }

        try {
            // Launch Puppeteer browser
            this.browser = await puppeteer.launch({
                headless: process.env.NODE_ENV === 'production' ? 'new' : false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ],
                slowMo: 100,
                defaultViewport: { width: 1920, height: 1080 }
            });

            this.page = await this.browser.newPage();
            
            // Set user agent and stealth measures
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Anti-detection measures
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });

            // Try to restore session first
            const sessionRestored = await this.restoreSession();
            if (sessionRestored) {
                console.log('📂 Session data restored, checking if still logged in...');
                const isLoggedIn = await this.checkLoginStatus();
                if (isLoggedIn) {
                    this.isLoggedIn = true;
                    console.log('✅ Session restored and still logged in!');
                    return { success: true, method: 'session_restore' };
                } else {
                    console.log('⚠️ Session expired, need to login again');
                }
            } else {
                console.log('📂 No session found, will login fresh');
            }

            // If we get here, we need to login
            console.log('🔐 Starting fresh login process...');
            await this.login();
            
            // Save session for future use
            await this.saveSession();
            
            console.log('✅ Twitter Service initialized successfully');
            return { success: true, method: 'fresh_login' };
            
        } catch (error) {
            console.error('❌ Failed to initialize Twitter Service:', error);
            throw error;
        }
    }

    async login() {
        console.log('🔐 Logging into Twitter...');
        
        try {
            await this.page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });
            console.log('📄 Login page loaded');
            
            // Wait for and enter username
            console.log('🔍 Looking for username field...');
            await this.page.waitForSelector('input[name="text"]', { timeout: 15000 });
            
            console.log('✏️ Entering username...');
            await this.page.click('input[name="text"]');
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type('input[name="text"]', this.credentials.username, { delay: 100 });
            
            // Wait a moment before clicking Next
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to find and click the Next button more specifically
            console.log('🔍 Looking for Next button...');
            
            // Wait for page to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            let nextClicked = false;
            
            // First, try to find buttons with "Next" text
            try {
                const buttons = await this.page.$$('button, div[role="button"], span[role="button"]');
                console.log(`🔍 Found ${buttons.length} potential buttons`);
                
                for (const button of buttons) {
                    try {
                        const text = await this.page.evaluate(el => el.textContent?.trim().toLowerCase(), button);
                        console.log(`🔍 Button text: "${text}"`);
                        
                        if (text === 'next' || text === 'weiter' || text === 'siguiente') {
                            console.log('✅ Found Next button by text, clicking...');
                            await button.click();
                            nextClicked = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                console.log('❌ Error finding buttons by text:', e.message);
            }
            
            // If text search didn't work, try specific selectors
            if (!nextClicked) {
                const nextButtonSelectors = [
                    'button[data-testid="LoginForm_Login_Button"]',
                    '[data-testid="LoginForm_Login_Button"]',
                    'button:nth-of-type(1)',
                    'div[role="button"]:nth-of-type(1)'
                ];
                
                for (const selector of nextButtonSelectors) {
                    try {
                        const element = await this.page.waitForSelector(selector, { timeout: 3000 });
                        if (element) {
                            const text = await this.page.evaluate(el => el.textContent?.trim(), element);
                            console.log(`🔍 Found element with selector ${selector}, text: "${text}"`);
                            await element.click();
                            console.log(`✅ Clicked button: ${selector}`);
                            nextClicked = true;
                            break;
                        }
                    } catch (e) {
                        console.log(`❌ Selector not found: ${selector}`);
                        continue;
                    }
                }
            }
            
            // Last resort: try Enter key
            if (!nextClicked) {
                console.log('⚠️ No Next button found, trying Enter key...');
                await this.page.focus('input[name="text"]');
                await this.page.keyboard.press('Enter');
            }
            
            // Wait for next step
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Debug: Check current URL and page state
            const currentUrl = this.page.url();
            console.log('🔗 Current URL after Next click:', currentUrl);
            
            // Take a screenshot for debugging
            try {
                await this.page.screenshot({ path: './temp/after-next-click.png' });
                console.log('📸 Screenshot saved: after-next-click.png');
            } catch (e) {
                console.log('⚠️ Could not take screenshot');
            }
            
            // Check what inputs are available now
            try {
                const inputs = await this.page.$$('input');
                console.log(`🔍 Found ${inputs.length} input fields after Next click`);
                
                for (let i = 0; i < inputs.length; i++) {
                    const input = inputs[i];
                    const type = await this.page.evaluate(el => el.type, input);
                    const name = await this.page.evaluate(el => el.name, input);
                    const placeholder = await this.page.evaluate(el => el.placeholder, input);
                    console.log(`Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}"`);
                }
            } catch (e) {
                console.log('❌ Error checking inputs:', e.message);
            }
            
            // Check if email verification is required
            console.log('🔍 Checking for email verification step...');
            try {
                const emailField = await this.page.waitForSelector('input[name="text"]', { timeout: 5000 });
                if (emailField && this.credentials.email) {
                    console.log('📧 Email verification required, entering email...');
                    await this.page.type('input[name="text"]', this.credentials.email, { delay: 100 });
                    
                    // Click Next for email step
                    const emailNextSelectors = [
                        '[role="button"]',
                        '[data-testid="ocf-button"]',
                        'button[type="button"]'
                    ];
                    
                    for (const selector of emailNextSelectors) {
                        try {
                            await this.page.waitForSelector(selector, { timeout: 3000 });
                            await this.page.click(selector);
                            console.log('✅ Email verification step completed');
                            break;
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (e) {
                console.log('ℹ️ No email verification required');
            }
            
            // Enter password
            console.log('🔍 Looking for password field...');
            await this.page.waitForSelector('input[name="password"]', { timeout: 15000 });
            
            console.log('🔒 Entering password...');
            await this.page.click('input[name="password"]');
            await this.page.type('input[name="password"]', this.credentials.password, { delay: 100 });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Click Login button
            console.log('🔍 Looking for Login button...');
            const loginButtonSelectors = [
                '[data-testid="LoginForm_Login_Button"]',
                'button[type="submit"]',
                '[role="button"]',
                'div[role="button"]'
            ];
            
            let loginClicked = false;
            for (const selector of loginButtonSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked Login button: ${selector}`);
                    loginClicked = true;
                    break;
                } catch (e) {
                    console.log(`❌ Login button not found: ${selector}`);
                    continue;
                }
            }
            
            if (!loginClicked) {
                console.log('⚠️ No Login button found, trying Enter key...');
                await this.page.keyboard.press('Enter');
            }
            
            // Wait for login to complete
            console.log('⏳ Waiting for login to complete...');
            try {
                await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 30000 });
                this.isLoggedIn = true;
                console.log('✅ Successfully logged into Twitter!');
            } catch (e) {
                // Check current URL and page content for debugging
                const currentUrl = this.page.url();
                console.log('🔗 Current URL:', currentUrl);
                
                if (currentUrl.includes('challenge') || currentUrl.includes('flow')) {
                    console.log('🛡️ Twitter requires additional verification (2FA/challenge)');
                    console.log('💡 Please complete verification manually in the browser window');
                    
                    // Wait longer for manual intervention
                    try {
                        await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 120000 });
                        this.isLoggedIn = true;
                        console.log('✅ Login completed after manual verification!');
                    } catch (finalError) {
                        throw new Error('Login timed out waiting for manual verification');
                    }
                } else {
                    throw new Error('Login failed - could not find home page elements');
                }
            }
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            
            // Take screenshot for debugging
            try {
                await this.page.screenshot({ path: './temp/login-error.png' });
                console.log('📸 Screenshot saved to temp/login-error.png');
            } catch (screenshotError) {
                console.warn('⚠️ Could not take screenshot');
            }
            
            // Log current page info
            const currentUrl = this.page.url();
            console.log('🔗 Current URL:', currentUrl);
            
            throw error;
        }
    }

    async checkLoginStatus() {
        try {
            console.log('🔍 Checking current login status...');
            
            // First check current URL without navigating
            const currentUrl = this.page.url();
            console.log('🔗 Current URL:', currentUrl);
            
            // If we're already on a Twitter page, check for logged-in elements
            if (currentUrl.includes('twitter.com') || currentUrl.includes('x.com')) {
                try {
                    // Check for logged-in elements without waiting too long
                    await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 3000 });
                    console.log('✅ Already logged in (found tweet button)');
                    return true;
                } catch (e) {
                    console.log('🔍 Tweet button not found, checking URL...');
                    
                    // Check if we're on login page
                    if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
                        console.log('❌ On login page, not logged in');
                        return false;
                    }
                    
                    // Try to navigate to home to verify
                    try {
                        console.log('🔍 Navigating to home to verify login...');
                        await this.page.goto('https://twitter.com/home', { 
                            waitUntil: 'domcontentloaded', 
                            timeout: 15000 
                        });
                        
                        // Wait a moment for page to load
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const newUrl = this.page.url();
                        console.log('🔗 New URL after navigation:', newUrl);
                        
                        if (newUrl.includes('/login') || newUrl.includes('/i/flow/login')) {
                            console.log('❌ Redirected to login page, not logged in');
                            return false;
                        }
                        
                        // Check for logged-in elements again
                        try {
                            await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 5000 });
                            console.log('✅ Successfully verified login status');
                            return true;
                        } catch (e) {
                            console.log('❌ Could not find tweet button after navigation');
                            return false;
                        }
                        
                    } catch (navError) {
                        console.log('❌ Navigation failed:', navError.message);
                        return false;
                    }
                }
            } else {
                // Not on Twitter, need to navigate
                console.log('🔍 Not on Twitter, navigating to check status...');
                try {
                    await this.page.goto('https://twitter.com/home', { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 15000 
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const finalUrl = this.page.url();
                    console.log('🔗 Final URL:', finalUrl);
                    
                    if (finalUrl.includes('/login') || finalUrl.includes('/i/flow/login')) {
                        return false;
                    }
                    
                    await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 5000 });
                    return true;
                    
                } catch (error) {
                    console.log('❌ Failed to navigate and check:', error.message);
                    return false;
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to check login status:', error.message);
            return false;
        }
    }

    async restoreSession() {
        try {
            const sessionData = await fs.readFile(this.sessionPath, 'utf-8');
            const session = JSON.parse(sessionData);
            
            if (session.cookies) {
                await this.page.setCookie(...session.cookies);
            }
            
            if (session.localStorage) {
                await this.page.evaluateOnNewDocument((localStorage) => {
                    for (const [key, value] of Object.entries(localStorage)) {
                        window.localStorage.setItem(key, value);
                    }
                }, session.localStorage);
            }
            
            return true;
        } catch (error) {
            console.log('📝 No saved session found, will login fresh');
            return false;
        }
    }

    async saveSession() {
        try {
            // Ensure temp directory exists
            await fs.mkdir('./temp', { recursive: true });
            
            const cookies = await this.page.cookies();
            const localStorage = await this.page.evaluate(() => {
                const storage = {};
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    storage[key] = window.localStorage.getItem(key);
                }
                return storage;
            });
            
            const sessionData = {
                cookies,
                localStorage,
                timestamp: new Date().toISOString()
            };
            
            await fs.writeFile(this.sessionPath, JSON.stringify(sessionData, null, 2));
            console.log('💾 Session saved successfully');
            
        } catch (error) {
            console.error('❌ Failed to save session:', error);
        }
    }

    async postTweet(content) {
        if (!this.isLoggedIn) {
            throw new Error('Not logged in to Twitter');
        }
        
        console.log('📝 Posting tweet:', content);
        
        try {
            await this.page.goto('https://twitter.com/home');
            await this.page.waitForTimeout(2000);
            
            // Click tweet button
            await this.page.click('[data-testid="SideNav_NewTweet_Button"]');
            
            // Type tweet content
            await this.page.waitForSelector('[data-testid="tweetTextarea_0"]');
            await this.page.click('[data-testid="tweetTextarea_0"]');
            await this.page.type('[data-testid="tweetTextarea_0"]', content);
            
            // Post tweet
            await this.page.waitForTimeout(1000);
            await this.page.click('[data-testid="tweetButtonInline"]');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('✅ Tweet posted successfully');
            return { success: true, content };
            
        } catch (error) {
            console.error('❌ Failed to post tweet:', error);
            throw new Error(`Failed to post tweet: ${error.message}`);
        }
    }

    async replyToTweet(tweetUrl, replyContent) {
        if (!this.isLoggedIn) {
            throw new Error('Not logged in to Twitter');
        }
        
        console.log('💬 Replying to tweet:', tweetUrl);
        
        try {
            await this.page.goto(tweetUrl);
            await this.page.waitForTimeout(2000);
            
            // Click reply button
            await this.page.click('[data-testid="reply"]');
            
            // Type reply
            await this.page.waitForSelector('[data-testid="tweetTextarea_0"]');
            await this.page.type('[data-testid="tweetTextarea_0"]', replyContent);
            
            // Post reply
            await this.page.click('[data-testid="tweetButtonInline"]');
            await this.page.waitForTimeout(2000);
            
            console.log('✅ Reply posted successfully');
            return { success: true, content: replyContent };
            
        } catch (error) {
            console.error('❌ Failed to post reply:', error);
            throw new Error(`Failed to post reply: ${error.message}`);
        }
    }

    async checkMentions() {
        if (!this.isLoggedIn) {
            return [];
        }
        
        console.log('🔍 Checking mentions...');
        
        try {
            // Try different URLs for mentions
            const mentionUrls = [
                'https://twitter.com/notifications/mentions',
                'https://x.com/notifications/mentions',
                'https://twitter.com/notifications',
                'https://x.com/notifications'
            ];
            
            let navigationSuccess = false;
            for (const url of mentionUrls) {
                try {
                    console.log(`🔗 Trying URL: ${url}`);
                    await this.page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 10000 
                    });
                    navigationSuccess = true;
                    console.log(`✅ Successfully navigated to: ${url}`);
                    break;
                } catch (navError) {
                    console.log(`❌ Failed to navigate to ${url}: ${navError.message}`);
                    continue;
                }
            }
            
            if (!navigationSuccess) {
                console.log('❌ Could not navigate to any mentions URL');
                return [];
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const mentions = await this.page.evaluate(() => {
                const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
                const results = [];
                
                for (const element of tweetElements) {
                    try {
                        const textElement = element.querySelector('[data-testid="tweetText"]');
                        const text = textElement ? textElement.innerText : '';
                        
                        const usernameElement = element.querySelector('[data-testid="User-Name"] a[role="link"]');
                        const username = usernameElement ? usernameElement.href.split('/').pop() : '';
                        
                        const timeElement = element.querySelector('time');
                        const timestamp = timeElement ? timeElement.getAttribute('datetime') : '';
                        
                        const linkElement = element.querySelector('a[href*="/status/"]');
                        const tweetUrl = linkElement ? linkElement.href : '';
                        const tweetId = tweetUrl.split('/status/')[1]?.split('?')[0] || '';
                        
                        if (text && username && tweetId) {
                            results.push({
                                id: tweetId,
                                text: text,
                                author: {
                                    username: username
                                },
                                timestamp: timestamp,
                                url: tweetUrl,
                                scrapedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn('Error parsing tweet element:', error);
                    }
                }
                
                return results;
            });
            
            // Filter out processed mentions
            const newMentions = mentions.filter(mention => !this.processedMentions.has(mention.id));
            
            // Mark as processed
            newMentions.forEach(mention => this.processedMentions.add(mention.id));
            
            console.log(`✅ Found ${newMentions.length} new mentions`);
            return newMentions;
            
        } catch (error) {
            console.error('❌ Failed to check mentions:', error.message);
            
            // Take screenshot for debugging
            try {
                await this.page.screenshot({ path: './temp/mentions-error.png' });
                console.log('📸 Screenshot saved: mentions-error.png');
            } catch (screenshotError) {
                console.log('⚠️ Could not take screenshot');
            }
            
            return [];
        }
    }

    async startMentionMonitoring(interval = 60000) {
        if (this.isMonitoring) {
            console.log('⚠️ Mention monitoring already active');
            return;
        }
        
        console.log('👀 Starting mention monitoring...');
        this.isMonitoring = true;
        
        const monitor = async () => {
            if (!this.isMonitoring) return;
            
            try {
                const mentions = await this.checkMentions();
                
                for (const mention of mentions) {
                    console.log(`🎯 NEW MENTION: @${mention.author.username} said "${mention.text}"`);
                    
                    if (this.onMentionFound) {
                        this.onMentionFound(mention);
                    }
                }
                
            } catch (error) {
                console.error('❌ Monitoring error:', error);
            }
        };
        
        // Initial check
        await monitor();
        
        // Set up interval
        this.mentionInterval = setInterval(monitor, interval);
        console.log(`✅ Mention monitoring started (checking every ${interval/1000}s)`);
    }

    stopMentionMonitoring() {
        console.log('⏹️ Stopping mention monitoring...');
        this.isMonitoring = false;
        if (this.mentionInterval) {
            clearInterval(this.mentionInterval);
            this.mentionInterval = null;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    getStats() {
        return {
            isLoggedIn: this.isLoggedIn,
            isMonitoring: this.isMonitoring,
            processedMentions: this.processedMentions.size,
            method: 'Server-side Puppeteer'
        };
    }
}
