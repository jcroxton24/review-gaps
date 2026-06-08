const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Only http and https URLs are supported' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReviewGaps/1.0)',
      },
      redirect: 'follow',
      timeout: 15000,
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results = [];
    $('h3.product__title').each((i, el) => {
      const text = $(el).text().trim();
      if (text) results.push(text);
    });

    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: `Could not reach URL: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
