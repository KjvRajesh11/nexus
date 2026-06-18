/* eslint-disable */
const fs = require('fs');
// Polyfill browser globals required by pdf-parse's dependency (pdfjs-dist) in Node.js
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

const pdf = require('pdf-parse');

async function run() {
  try {
    const buffer = fs.readFileSync('sample.pdf');
    const pdfNode = require('pdf-parse');
    console.log("Instantiating PDFParse...");
    const parser = new pdfNode.PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    console.log("PDF parsed successfully!");
    console.log("Text length:", textResult.text.length);
    console.log("Text preview:", textResult.text.trim().slice(0, 300));


  } catch (error) {
    console.error("PDF parsing failed:", error);
  }
}

run();
