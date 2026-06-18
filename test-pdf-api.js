/* eslint-disable */
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/chat';

// Try to find a PDF to test with — fall back to a tiny hand-crafted one
function getPdfBase64() {
  const candidates = ['sample.pdf', 'test.pdf'];
  for (const name of candidates) {
    const p = path.join(__dirname, name);
    if (fs.existsSync(p)) {
      console.log(`[TEST] Using existing PDF: ${name}`);
      return { base64: fs.readFileSync(p).toString('base64'), name };
    }
  }

  // Minimal valid PDF that contains the text "Hello from Nexus PDF test"
  const minimalPdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>
stream
BT /F1 12 Tf 100 700 Td (Hello from Nexus PDF test) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000368 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
453
%%EOF`;

  console.log('[TEST] No PDF found — using inline minimal PDF');
  return { base64: Buffer.from(minimalPdf).toString('base64'), name: 'inline-test.pdf' };
}

async function run() {
  const { base64, name } = getPdfBase64();

  console.log(`\n[TEST] POSTing "${name}" to ${API_URL} …\n`);

  const body = JSON.stringify({
    message: 'What does this document say? Summarize it.',
    history: [],
    file: {
      name,
      type: 'application/pdf',
      base64,
    },
  });

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('[FAIL] API returned error:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅  SUCCESS — AI response:');
    console.log('═══════════════════════════════════════════');
    console.log(data.response);
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    console.error('[FAIL] Fetch error:', err.message);
    process.exit(1);
  }
}

run();
