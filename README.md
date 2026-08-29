# presend-api

Zero-dependency JavaScript client for the free [Presend API](https://presend.pages.dev/api) — no signup, no API key.

```bash
npm install presend-api
```

## Usage

```js
const presend = require('presend-api');
// or: import presend from 'presend-api';

// Generate UUIDs
const { uuids } = await presend.generateUuid(3);

// Clean tracking parameters from a URL
const { clean } = await presend.cleanUrl('https://example.com?utm_source=newsletter');
const { results } = await presend.cleanUrls(['https://a.com?fbclid=x', 'https://b.com?gclid=y']);

// Hash a file (Buffer or ArrayBuffer)
const fs = require('fs');
const { hashes } = await presend.hashFile(fs.readFileSync('./file.pdf'));

// Base64 encode/decode
const { result: encoded } = await presend.base64Encode('hello world');
const { result: decoded } = await presend.base64Decode(encoded);

// Decode a JWT (header + payload, no signature verification)
const { header, payload } = await presend.decodeJwt(token);

// IP geolocation of the caller
const { ip, city, country_name, currency } = await presend.getIp();

// Convert/parse timestamps
const { iso_8601 } = await presend.timestamp({ unix: 1700000000 });
const { unix_seconds } = await presend.timestamp({ date: '2024-01-01' });

// Convert colors
const { hex, rgb, hsl } = await presend.convertColor({ hex: 'ff5733' });

// Parse a User-Agent string
const { parsed } = await presend.parseUserAgent(request.headers['user-agent']);

// Generate a secure password with entropy estimate
const { password, entropy_bits } = await presend.generatePassword({ length: 20, symbols: true });

// Check if a password has been breached (HIBP k-anonymity, never sent in full)
const { breached, breach_count } = await presend.checkPasswordBreach('some-password');

// Validate an email (syntax + real MX record check)
const { valid, has_mx } = await presend.validateEmail('foo@example.com');

// Detect disposable/throwaway email domains
const { disposable } = await presend.isDisposableEmail('foo@mailinator.com');

// Fetch a domain's favicon URL
const { favicon } = await presend.getFavicon('github.com');

// Audit a site's HTTP security headers
const { grade, score } = await presend.securityHeaders('https://example.com');

// Check a URL against a public malware/phishing database
const { malicious } = await presend.urlReputation('https://example.com');

// Passive subdomain discovery via Certificate Transparency logs
const { subdomains } = await presend.findSubdomains('example.com');

// Convert between JSON and CSV
const { result: csv } = await presend.jsonToCsv('[{"name":"Alice","age":30}]');
const { result: json } = await presend.csvToJson('name,age\nAlice,30');

// --- Chained endpoints: combine multiple operations server-side in one call ---

// Combined email verification: syntax + MX + disposable + role-account
const { valid, disposable, role_account } = await presend.emailVerify('foo@example.com');

// Combined password check: strength/entropy + optional breach check
const { strength, entropy_bits, breach } = await presend.passwordCheck('some-password');

// Validate and format a phone number (auto-detects country from your IP if omitted)
const { valid: phoneValid, formats } = await presend.phoneVerify('4155552671', 'US');

// Strip EXIF/GPS from an image — no re-encoding, zero quality loss
const fs2 = require('fs');
const { buffer: cleaned } = await presend.cleanImage(fs2.readFileSync('./photo.jpg'), 'image/jpeg');
fs2.writeFileSync('./photo-clean.jpg', cleaned);

// Merge 2+ PDFs and compress the result in one call
const { buffer: merged } = await presend.mergeAndCompressPdf([
  fs2.readFileSync('./a.pdf'),
  fs2.readFileSync('./b.pdf'),
]);
fs2.writeFileSync('./merged.pdf', merged);
```

## API

All methods return a Promise resolving to the parsed JSON response, and throw an `Error` (with `.status` and `.body`) on non-2xx responses.

| Method | Description |
|---|---|
| `hashFile(buffer)` | SHA-256/1/512 of a file (max 20MB) |
| `cleanUrl(url)` / `cleanUrls(urls[])` | Strip tracking params from URLs |
| `generateUuid(count?)` | Generate up to 100 UUID v4s |
| `base64Encode(text)` / `base64Decode(text)` | Base64 encode/decode |
| `decodeJwt(token)` | Decode a JWT's header and payload |
| `getIp()` | Caller's IP with geolocation, currency, language |
| `timestamp({ unix?, date? })` | Convert between Unix time and ISO date |
| `convertColor({ hex?, rgb?, hsl? })` | Convert between color formats |
| `parseUserAgent(ua?)` | Parse a User-Agent string |
| `generatePassword({ length?, symbols?, uppercase?, numbers?, excludeAmbiguous? })` | Generate a secure password |
| `checkPasswordBreach(password)` | Check against Have I Been Pwned (k-anonymity) |
| `validateEmail(email)` | Syntax + MX record validation |
| `isDisposableEmail(email)` | Detect throwaway email domains |
| `getFavicon(domain)` | Fetch a domain's favicon URL |
| `jsonToCsv(json)` / `csvToJson(csv)` | Convert between JSON and CSV |
| `securityHeaders(url)` | Audit HTTP security headers, get a letter grade |
| `urlReputation(url)` | Check a URL against a public malware/phishing database |
| `findSubdomains(domain)` | Passive subdomain discovery via Certificate Transparency logs |
| `emailVerify(email)` | Combined: syntax + MX + disposable-domain + role-account detection |
| `passwordCheck(password, checkBreach?)` | Combined: strength/entropy scoring + optional HIBP breach check |
| `phoneVerify(number, country?)` | Validate/format a phone number; auto-detects country from IP if omitted |
| `cleanImage(buffer, contentType?)` | Strip EXIF/GPS (JPEG) or text metadata (PNG) — returns `{ buffer, headers }`, no quality loss |
| `mergeAndCompressPdf(files[])` | Merge 2+ PDFs and compress the result — returns `{ buffer, headers }`; `files` is an array of `Buffer` |

## Rate limits

Endpoints are fair-use rate-limited (typically 20-60 requests/minute per IP). No SLA — this is a free community API.

## License

MIT
