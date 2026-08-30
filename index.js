// presend-api — client CommonJS, zéro dépendance (utilise fetch natif, Node 18+)

const BASE = 'https://presend.pages.dev/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, options);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// For binary responses (merge-and-compress-pdf, clean-image): returns
// { buffer, headers } on success, still throws a JSON-parsed Error on failure.
async function requestBinary(path, options = {}) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { error: `HTTP ${res.status}` };
    }
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    headers: Object.fromEntries(res.headers.entries()),
  };
}

async function hashFile(buffer) {
  return request('/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
}

async function cleanUrl(url) {
  return request('/url-clean?url=' + encodeURIComponent(url));
}

async function cleanUrls(urls) {
  return request('/url-clean', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
}

async function generateUuid(count = 1) {
  return request('/uuid?count=' + encodeURIComponent(count));
}

async function base64Encode(text) {
  return request('/base64?action=encode&text=' + encodeURIComponent(text));
}

async function base64Decode(text) {
  return request('/base64?action=decode&text=' + encodeURIComponent(text));
}

async function decodeJwt(token) {
  return request('/jwt-decode?token=' + encodeURIComponent(token));
}

async function getIp() {
  return request('/ip');
}

async function timestamp(opts = {}) {
  const params = new URLSearchParams();
  if (opts.unix !== undefined) params.set('unix', opts.unix);
  if (opts.date !== undefined) params.set('date', opts.date);
  const qs = params.toString();
  return request('/timestamp' + (qs ? '?' + qs : ''));
}

async function convertColor(input) {
  const params = new URLSearchParams();
  if (input.hex) params.set('hex', input.hex);
  else if (input.rgb) params.set('rgb', input.rgb);
  else if (input.hsl) params.set('hsl', input.hsl);
  return request('/color?' + params.toString());
}

async function parseUserAgent(ua) {
  const qs = ua ? '?ua=' + encodeURIComponent(ua) : '';
  return request('/user-agent' + qs);
}

async function generatePassword(opts = {}) {
  const params = new URLSearchParams();
  if (opts.length !== undefined) params.set('length', opts.length);
  if (opts.symbols !== undefined) params.set('symbols', opts.symbols ? '1' : '0');
  if (opts.uppercase !== undefined) params.set('uppercase', opts.uppercase ? '1' : '0');
  if (opts.numbers !== undefined) params.set('numbers', opts.numbers ? '1' : '0');
  if (opts.excludeAmbiguous !== undefined) params.set('exclude_ambiguous', opts.excludeAmbiguous ? '1' : '0');
  const qs = params.toString();
  return request('/password' + (qs ? '?' + qs : ''));
}

async function validateEmail(email) {
  return request('/email-validate?email=' + encodeURIComponent(email));
}

async function isDisposableEmail(email) {
  return request('/email-disposable?email=' + encodeURIComponent(email));
}

async function checkPasswordBreach(password) {
  return request('/password-breach?password=' + encodeURIComponent(password));
}

async function getFavicon(domain) {
  return request('/favicon?domain=' + encodeURIComponent(domain));
}

async function csvToJson(csv) {
  return request('/csv-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction: 'csv-to-json', data: csv }),
  });
}

async function jsonToCsv(json) {
  return request('/csv-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction: 'json-to-csv', data: json }),
  });
}

async function securityHeaders(url) {
  return request('/security-headers?url=' + encodeURIComponent(url));
}

async function urlReputation(url) {
  return request('/url-reputation?url=' + encodeURIComponent(url));
}

async function findSubdomains(domain) {
  return request('/subdomains?domain=' + encodeURIComponent(domain));
}

// --- Added for the 5 new chained endpoints ---

// files: array of Buffer, or array of { name, buffer }. Returns { buffer, headers }
// where buffer is the merged+compressed PDF; headers include X-Page-Count.
async function mergeAndCompressPdf(files) {
  const formData = new FormData();
  files.forEach((f, i) => {
    if (Buffer.isBuffer(f)) {
      formData.append('files', new Blob([f]), `file${i}.pdf`);
    } else {
      formData.append('files', new Blob([f.buffer]), f.name || `file${i}.pdf`);
    }
  });
  return requestBinary('/merge-and-compress-pdf', { method: 'POST', body: formData });
}

// buffer: image bytes (Buffer). contentType: 'image/jpeg' or 'image/png'.
// Returns { buffer, headers } with EXIF/GPS or text metadata stripped —
// pixel data is never re-encoded, so there is no quality loss.
async function cleanImage(buffer, contentType = 'image/jpeg') {
  return requestBinary('/clean-image', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: buffer,
  });
}

// Combines syntax check, MX lookup, disposable-domain detection, and
// generic/role-account detection in one call.
async function emailVerify(email) {
  return request('/email-verify?email=' + encodeURIComponent(email));
}

// Combines strength/entropy scoring with an optional HIBP breach check.
// The password is sent in the POST body, never in a URL.
async function passwordCheck(password, checkBreach = true) {
  return request('/password-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, check_breach: checkBreach }),
  });
}

// Validates and formats a phone number. If country is omitted for a number
// without a leading '+', the caller's IP-derived country is used automatically.
async function phoneVerify(number, country) {
  const params = new URLSearchParams({ number });
  if (country) params.set('country', country);
  return request('/phone-verify?' + params.toString());
}

// --- Added for the 9 new chained endpoints (v1.4.0) ---

// Combines security-headers + url-reputation + subdomains into one report.
async function securityScan(url) {
  return request('/security-scan?url=' + encodeURIComponent(url));
}

// Checks SPF strength, DMARC policy, and a best-effort DKIM lookup.
async function emailSecurity(domain) {
  return request('/email-security?domain=' + encodeURIComponent(domain));
}

// files: array of Buffer, or array of { name, buffer }. 1 file returns a
// hash; 2 files return a direct similarity comparison. JPEG/PNG only.
async function imageSimilarity(files) {
  const formData = new FormData();
  files.forEach((f, i) => {
    if (Buffer.isBuffer(f)) {
      formData.append('files', new Blob([f]), `file${i}`);
    } else {
      formData.append('files', new Blob([f.buffer]), f.name || `file${i}`);
    }
  });
  return request('/image-similarity', { method: 'POST', body: formData });
}

// file: Buffer or { name, buffer }. Decodes a QR code and, if it's a URL,
// checks it against URLhaus for phishing/malware indicators.
async function qrScan(file) {
  const formData = new FormData();
  if (Buffer.isBuffer(file)) {
    formData.append('file', new Blob([file]), 'qrcode.png');
  } else {
    formData.append('file', new Blob([file.buffer]), file.name || 'qrcode.png');
  }
  return request('/qr-scan', { method: 'POST', body: formData });
}

// buffer: raw file bytes. Detects the real type from binary signature and
// flags a mismatch against contentType (the "claimed" type).
async function fileType(buffer, contentType = 'application/octet-stream') {
  return request('/file-type', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: buffer,
  });
}

// opts: { secret } for HS256/384/512, or { jwk } / { jwksUrl } for
// RS/PS/ES algorithms. Actually verifies the cryptographic signature.
async function jwtVerify(token, opts = {}) {
  const body = { token };
  if (opts.secret) body.secret = opts.secret;
  if (opts.jwk) body.jwk = opts.jwk;
  if (opts.jwksUrl) body.jwks_url = opts.jwksUrl;
  return request('/jwt-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// buffer: raw file bytes. Hashes (SHA-256) and checks against
// MalwareBazaar (abuse.ch). "Not found" does not guarantee safety.
async function malwareCheck(buffer) {
  return request('/malware-check', { method: 'POST', body: buffer });
}

// texts: array of 1 or 2 strings. SimHash-based near-duplicate detection
// -- unrelated texts typically score ~50% by chance, not 0%.
async function textSimilarity(texts) {
  return request('/text-similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });
}

// Fetches robots.txt and reports which known AI crawlers (GPTBot,
// ClaudeBot, PerplexityBot, etc.) are allowed or blocked.
async function aiCrawlerCheck(domain) {
  return request('/ai-crawler-check?domain=' + encodeURIComponent(domain));
}

module.exports = {
  hashFile,
  cleanUrl,
  cleanUrls,
  generateUuid,
  base64Encode,
  base64Decode,
  decodeJwt,
  getIp,
  timestamp,
  convertColor,
  parseUserAgent,
  generatePassword,
  validateEmail,
  isDisposableEmail,
  checkPasswordBreach,
  getFavicon,
  csvToJson,
  jsonToCsv,
  securityHeaders,
  urlReputation,
  findSubdomains,
  mergeAndCompressPdf,
  cleanImage,
  emailVerify,
  passwordCheck,
  phoneVerify,
  securityScan,
  emailSecurity,
  imageSimilarity,
  qrScan,
  fileType,
  jwtVerify,
  malwareCheck,
  textSimilarity,
  aiCrawlerCheck,
};
