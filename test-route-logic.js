const pdf = require('pdf-parse');

async function test() {
  const file = {
    name: "secret.txt",
    type: "text/plain",
    base64: Buffer.from("The secret keyword is OLYMPUS-99.").toString('base64')
  };
  
  let fileContent = '';
  if (file && file.base64) {
    try {
      const fileBuffer = Buffer.from(file.base64, 'base64');
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const pdfData = await pdf(fileBuffer);
        fileContent = pdfData.text || '';
      } else {
        fileContent = fileBuffer.toString('utf-8');
      }
    } catch (err) {
      console.error('Error extracting text from file:', err);
    }
  }
  console.log("Extracted content:", fileContent);
}

test();
