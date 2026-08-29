// presend-api — client ESM (réexporte la version CommonJS)
import cjs from './index.js';

export const {
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
} = cjs;

export default cjs;
