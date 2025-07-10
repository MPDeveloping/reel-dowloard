const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

let userDownloadCount = {}; // Track user IPs

// Serve static files from public folder
app.use(express.static('public'));

// API route for downloading reels
app.get('/api/download', async (req, res) => {
    const reelURL = req.query.url;
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Daily limit logic
    const today = new Date().toISOString().split('T')[0];
    if (!userDownloadCount[userIP] || userDownloadCount[userIP].date !== today) {
        userDownloadCount[userIP] = { count: 0, date: today };
    }

    if (userDownloadCount[userIP].count >= 10) {
        return res.json({ success: false, message: "❌ Daily download limit reached (10 reels). Try again tomorrow." });
    }

    try {
        const { data } = await axios.get(reelURL);
        const $ = cheerio.load(data);
        const videoURL = $('meta[property="og:video"]').attr('content');

        if (videoURL) {
            userDownloadCount[userIP].count++;
            res.json({ success: true, video: videoURL });
        } else {
            res.json({ success: false, message: '❌ Could not fetch video. Make sure the reel is public!' });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: '⚠️ Error fetching video. Try again!' });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
