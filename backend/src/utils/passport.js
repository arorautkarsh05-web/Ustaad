const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const generatePassportId = () => {
  const year = new Date().getFullYear();
  const unique = uuidv4().split('-')[0].toUpperCase();
  return `FP-${year}-${unique}`;
};

const generateQRCode = async (passportId, baseUrl = 'http://localhost:3000') => {
  const url = `${baseUrl}/passport/${passportId}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
  return { url, qrDataUrl };
};

module.exports = { generatePassportId, generateQRCode };

