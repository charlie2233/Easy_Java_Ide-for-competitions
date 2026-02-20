'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024;

function decodeHtmlEntities(input) {
  if (!input) return '';
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripTags(html) {
  return decodeHtmlEntities((html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizePre(preHtml) {
  const text = decodeHtmlEntities(
    (preHtml || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|p)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function extractTitle(html) {
  const match = (html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return stripTags(match[1]);
}

function pairSamples(inputs, outputs) {
  const count = Math.min(inputs.length, outputs.length, 20);
  const testCases = [];
  for (let i = 0; i < count; i++) {
    const input = normalizePre(inputs[i]);
    const output = normalizePre(outputs[i]);
    if (!input && !output) continue;
    testCases.push({
      name: `Sample ${i + 1}`,
      input,
      expectedOutput: output,
    });
  }
  return testCases;
}

function parseClassBasedSamples(html) {
  const inputRegex = /<div[^>]*class="[^"]*\b(?:sample-input|input|in)\b[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  const outputRegex = /<div[^>]*class="[^"]*\b(?:sample-output|output|out)\b[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;

  const inputs = [];
  const outputs = [];

  let match;
  while ((match = inputRegex.exec(html))) inputs.push(match[1]);
  while ((match = outputRegex.exec(html))) outputs.push(match[1]);

  return pairSamples(inputs, outputs);
}

function parseHeadingBasedSamples(html) {
  const markerRegex = /(sample\s*input(?:\s*\d+)?|input(?:\s*\d+)?|sample\s*output(?:\s*\d+)?|output(?:\s*\d+)?)[\s\S]{0,160}?<pre[^>]*>([\s\S]*?)<\/pre>/gi;

  const inputs = [];
  const outputs = [];
  let match;
  while ((match = markerRegex.exec(html))) {
    const marker = (match[1] || '').toLowerCase();
    if (marker.includes('output')) outputs.push(match[2]);
    else inputs.push(match[2]);
  }

  return pairSamples(inputs, outputs);
}

function detectSource(urlString = '') {
  const lower = urlString.toLowerCase();
  if (lower.includes('codeforces.com')) return 'codeforces';
  if (lower.includes('usaco.org')) return 'usaco';
  return 'generic';
}

function parseProblemSamplesFromHtml(html, urlString = '') {
  const title = extractTitle(html);
  const source = detectSource(urlString);

  let testCases = parseClassBasedSamples(html);
  if (!testCases.length) {
    testCases = parseHeadingBasedSamples(html);
  }

  return {
    ok: true,
    source,
    title,
    testCases,
  };
}

function fetchText(urlString, redirects = 0) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (_) {
      reject(new Error(`Invalid URL: ${urlString}`));
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'CompIDE/1.0 (+https://github.com/charlie2233/Easy_Java_Ide-for-competitions)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      },
      (res) => {
        const location = res.headers.location;
        if (location && res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          if (redirects >= MAX_REDIRECTS) {
            reject(new Error('Too many redirects.'));
            return;
          }
          const next = new URL(location, parsed).toString();
          resolve(fetchText(next, redirects + 1));
          return;
        }

        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`Failed to fetch page (HTTP ${res.statusCode || 'unknown'}).`));
          return;
        }

        let size = 0;
        const chunks = [];
        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(new Error('Response too large.'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf-8'));
        });
      },
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => req.destroy(new Error('Request timed out.')));
    req.end();
  });
}

async function fetchProblemSamples(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { ok: false, error: 'Problem URL is required.' };
  }
  try {
    const html = await fetchText(urlString.trim());
    const parsed = parseProblemSamplesFromHtml(html, urlString);
    if (!parsed.testCases.length) {
      return {
        ok: false,
        source: parsed.source,
        title: parsed.title,
        error: 'No sample tests found on this page.',
      };
    }
    return parsed;
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    };
  }
}

module.exports = {
  fetchProblemSamples,
  parseProblemSamplesFromHtml,
  decodeHtmlEntities,
  normalizePre,
};
