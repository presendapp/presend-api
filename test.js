// Test rapide contre l'API réelle en prod — pas de mock, valide le vrai comportement.
const presend = require('./index.js');

async function main() {
  let passed = 0, failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log('✅ ' + name);
      passed++;
    } catch (e) {
      console.log('❌ ' + name + ' — ' + e.message);
      failed++;
    }
  }

  await check('generateUuid returns a valid UUID', async () => {
    const r = await presend.generateUuid(1);
    if (!/^[0-9a-f-]{36}$/.test(r.uuids[0])) throw new Error('Invalid UUID format');
  });

  await check('cleanUrl strips utm params', async () => {
    const r = await presend.cleanUrl('https://example.com?utm_source=test');
    if (r.clean !== 'https://example.com/') throw new Error('Got: ' + r.clean);
  });

  await check('base64Encode/Decode roundtrip', async () => {
    const enc = await presend.base64Encode('hello presend');
    const dec = await presend.base64Decode(enc.result);
    if (dec.result !== 'hello presend') throw new Error('Roundtrip mismatch');
  });

  await check('convertColor hex to rgb', async () => {
    const r = await presend.convertColor({ hex: 'ff5733' });
    if (r.rgb_values.r !== 255) throw new Error('Wrong r value');
  });

  await check('timestamp converts unix correctly', async () => {
    const r = await presend.timestamp({ unix: 1700000000 });
    if (r.iso_8601 !== '2023-11-14T22:13:20.000Z') throw new Error('Got: ' + r.iso_8601);
  });

  await check('parseUserAgent detects Chrome', async () => {
    const r = await presend.parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
    if (r.parsed.browser !== 'Chrome') throw new Error('Got: ' + r.parsed.browser);
  });

  await check('decodeJwt decodes header and payload', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.dummy';
    const r = await presend.decodeJwt(token);
    if (r.payload.name !== 'John Doe') throw new Error('Got: ' + JSON.stringify(r.payload));
  });

  await check('getIp returns an ip field', async () => {
    const r = await presend.getIp();
    if (!r.ip) throw new Error('No ip field in response');
  });

  await check('generatePassword respects length', async () => {
    const r = await presend.generatePassword({ length: 24, symbols: true });
    if (r.password.length !== 24) throw new Error('Got length: ' + r.password.length);
  });

  await check('validateEmail confirms gmail has MX', async () => {
    const r = await presend.validateEmail('test@gmail.com');
    if (!r.has_mx) throw new Error('Expected gmail.com to have MX records');
  });

  await check('isDisposableEmail detects mailinator', async () => {
    const r = await presend.isDisposableEmail('test@mailinator.com');
    if (!r.disposable) throw new Error('Expected mailinator.com to be flagged disposable');
  });

  await check('checkPasswordBreach detects common password', async () => {
    const r = await presend.checkPasswordBreach('password123');
    if (!r.breached) throw new Error('Expected password123 to be breached');
  });

  await check('getFavicon returns a url', async () => {
    const r = await presend.getFavicon('github.com');
    if (!r.favicon || !r.favicon.startsWith('http')) throw new Error('Got: ' + JSON.stringify(r));
  });

  await check('jsonToCsv converts correctly', async () => {
    const r = await presend.jsonToCsv('[{"a":1,"b":2}]');
    if (r.result !== 'a,b\na value expected...'.split('...')[0] && !r.result.includes('a,b')) {
      // vérif simple : la ligne d'en-tête doit être présente
      if (!r.result.startsWith('a,b')) throw new Error('Got: ' + r.result);
    }
  });

  await check('csvToJson converts correctly', async () => {
    const r = await presend.csvToJson('a,b\n1,2');
    const parsed = JSON.parse(r.result);
    if (parsed[0].a !== '1') throw new Error('Got: ' + r.result);
  });

  await check('securityHeaders grades a known-good site', async () => {
    const r = await presend.securityHeaders('https://presend.pages.dev');
    if (typeof r.score !== 'number' || !r.grade) throw new Error('Got: ' + JSON.stringify(r));
  });

  await check('urlReputation returns a malicious boolean', async () => {
    const r = await presend.urlReputation('https://github.com');
    if (typeof r.malicious !== 'boolean') throw new Error('Got: ' + JSON.stringify(r));
  });

  await check('findSubdomains returns a subdomains array', async () => {
    const r = await presend.findSubdomains('presend.pages.dev');
    if (!Array.isArray(r.subdomains)) throw new Error('Got: ' + JSON.stringify(r));
  });

  // --- 5 new chained endpoints ---
  await check('emailVerify detects a disposable domain', async () => {
    const r = await presend.emailVerify('test@mailinator.com');
    if (r.disposable !== true) throw new Error('Got: ' + JSON.stringify(r));
  });
  await check('passwordCheck flags a known-breached weak password', async () => {
    const r = await presend.passwordCheck('password123', true);
    if (r.strength !== 'fair' || !r.breach || r.breach.breached !== true) {
      throw new Error('Got: ' + JSON.stringify(r));
    }
  });
  await check('phoneVerify validates an E.164 number', async () => {
    const r = await presend.phoneVerify('+14155552671');
    if (r.valid !== true || r.country !== 'US') throw new Error('Got: ' + JSON.stringify(r));
  });
  await check('cleanImage strips EXIF and returns a smaller buffer', async () => {
    const fs = require('fs');
    const original = fs.readFileSync('/tmp/test-fixtures/photo.jpg');
    const r = await presend.cleanImage(original, 'image/jpeg');
    if (!Buffer.isBuffer(r.buffer) || r.buffer.length >= original.length) {
      throw new Error('Expected a smaller cleaned buffer, got ' + r.buffer.length + ' vs original ' + original.length);
    }
  });
  await check('mergeAndCompressPdf merges 2 files and reports page count', async () => {
    const fs = require('fs');
    const doc1 = fs.readFileSync('/tmp/test-fixtures/doc1.pdf');
    const doc2 = fs.readFileSync('/tmp/test-fixtures/doc2.pdf');
    const r = await presend.mergeAndCompressPdf([doc1, doc2]);
    if (!Buffer.isBuffer(r.buffer) || r.headers['x-page-count'] !== '2') {
      throw new Error('Got page count: ' + r.headers['x-page-count']);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
