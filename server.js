import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Environment configuration
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Server Port
const PORT = process.env.PORT || 5000;

// Set of common stop words to exclude from frequency count
const stopWords = new Set([
    'the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'with', 'for', 'on', 'it', 'as', 'at', 'by', 'an', 'be', 'this', 'are', 'or', 'from', 'but', 'not', 'your'
]);

// Function to calculate the top N most frequent words
const getTopNWords = (text, n) => {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/) // Split by whitespace
        .filter(word => word && !stopWords.has(word)); // Remove empty strings and stop words

    const wordCounts = words.reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
    }, {});

    return Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency, descending
        .slice(0, n) // Get top N words
        .map(([word, count]) => ({ word, count }));
};

// API route for URL analysis
app.post('/api/analyze-url', async (req, res) => {
    const { url, topN } = req.body;
    try {
        const response = await fetch(url);
        const html = await response.text();

        const $ = cheerio.load(html);

        const visibleTextElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'a', 'button', 'span'];
        let visibleText = '';

        visibleTextElements.forEach(selector => {
            $(selector).each((_, element) => {
                const text = $(element).text().trim();
                if (text) {
                    visibleText += text + ' ';
                }
            });
        });

        // Get top N most frequent words
        const topWords = getTopNWords(visibleText, topN || 10);

        res.json({ topWords });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch or process the URL' });
    }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
