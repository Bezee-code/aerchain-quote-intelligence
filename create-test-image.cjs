const sharp = require('sharp');
const fs = require('fs');

const svg = `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="50" y="50" font-family="Arial" font-size="24" fill="black">Vendor Quotation</text>
  <text x="50" y="100" font-family="Arial" font-size="18" fill="black">Stainless Steel Ball Bearings 6205 - $12.50 each</text>
  <text x="50" y="130" font-family="Arial" font-size="18" fill="black">Deep Groove Ball Bearings 6206 - $8.75 each</text>
  <text x="50" y="160" font-family="Arial" font-size="18" fill="black">Tapered Roller Bearings 30208 - $15.25 each</text>
  <text x="50" y="220" font-family="Arial" font-size="18" fill="black">Payment Terms: Net 30</text>
  <text x="50" y="250" font-family="Arial" font-size="18" fill="black">Delivery: FOB Destination</text>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('test-files/test.png')
  .then(() => console.log('Created test.png'))
  .catch(console.error);