import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker with fallback URLs
const setupWorker = () => {
  if (typeof window !== 'undefined') {
    const version = pdfjsLib.version;
    // Try multiple CDN sources
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
  }
};

// Initialize worker
setupWorker();

export interface PriceConfig {
  bwSingleSide: number;
  bwDoubleSide: number;
  colorSingleSide: number;
  colorDoubleSide: number;
}

export const DEFAULT_PRICING: PriceConfig = {
  bwSingleSide: 1.5,
  bwDoubleSide: 1,
  colorSingleSide: 5,
  colorDoubleSide: 4,
};

/**
 * Extract page count from PDF by parsing the PDF structure
 * This works without a worker thread
 */
function extractPageCountFromPdfBytes(uint8Array: Uint8Array): number {
  try {
    const pdfText = new TextDecoder().decode(uint8Array);
    
    // Method 1: Look for /Pages and /Count
    const pagesMatch = pdfText.match(/\/Pages\s*(\d+)\s*0\s*R/);
    if (pagesMatch) {
      const pagesObjNum = pagesMatch[1];
      // Find the pages object
      const regex = new RegExp(`${pagesObjNum}\\s*0\\s*obj[^>]*?/Count\\s*(\\d+)`, 's');
      const countMatch = pdfText.match(regex);
      if (countMatch) {
        const pageCount = parseInt(countMatch[1], 10);
        if (pageCount > 0) {
          console.log(`[PDF] Extracted page count from /Count: ${pageCount}`);
          return pageCount;
        }
      }
    }
    
    // Method 2: Count /Type /Page objects
    const pageObjects = pdfText.match(/\/Type\s*\/Page\s*[^/]*(\/Parent|>>)/g) || [];
    if (pageObjects.length > 0) {
      console.log(`[PDF] Counted /Type /Page objects: ${pageObjects.length}`);
      return pageObjects.length;
    }
    
    return 1;
  } catch (e) {
    console.error('[PDF] Error extracting page count from bytes:', e);
    return 1;
  }
}

/**
 * Count the number of pages in a PDF file
 */
export async function countPdfPages(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log(`[PDF] Counting pages for ${file.name}, size: ${arrayBuffer.byteLength} bytes`);
    
    // First try pdfjs-dist if available
    try {
      const loadingTask = pdfjsLib.getDocument({ 
        data: uint8Array,
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false,
      });
      
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parsing timeout')), 5000))
      ]);
      
      const pageCount = (pdf as any).numPages;
      console.log(`[PDF] pdfjs-dist successfully read ${file.name}: ${pageCount} pages`);
      
      // Clean up
      (pdf as any).destroy?.();
      
      return pageCount;
    } catch (pdfJsError) {
      console.warn('[PDF] pdfjs-dist failed, trying fallback parsing:', pdfJsError);
      
      // Fallback to manual parsing
      const pageCount = extractPageCountFromPdfBytes(uint8Array);
      console.log(`[PDF] Fallback parsing result: ${pageCount} pages`);
      return pageCount;
    }
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    return 1;
  }
}

/**
 * Calculate the price for printing based on pages and settings
 */
export function calculatePrice(
  pageCount: number,
  colorMode: 'bw' | 'color',
  duplexMode: boolean,
  copies: number = 1,
  priceConfig: PriceConfig = DEFAULT_PRICING
): number {
  let pricePerPage: number;

  if (colorMode === 'bw') {
    pricePerPage = duplexMode ? priceConfig.bwDoubleSide : priceConfig.bwSingleSide;
  } else {
    pricePerPage = duplexMode ? priceConfig.colorDoubleSide : priceConfig.colorSingleSide;
  }

  const totalPages = pageCount * copies;
  const totalPrice = totalPages * pricePerPage;

  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Get price description for display
 */
export function getPriceDescription(
  colorMode: 'bw' | 'color',
  duplexMode: boolean,
  priceConfig: PriceConfig = DEFAULT_PRICING
): string {
  if (colorMode === 'bw') {
    const mode = duplexMode ? 'Double Side' : 'Single Side';
    const price = duplexMode ? priceConfig.bwDoubleSide : priceConfig.bwSingleSide;
    return `B/W ${mode}: ₹${price}/page`;
  } else {
    const mode = duplexMode ? 'Double Side' : 'Single Side';
    const price = duplexMode ? priceConfig.colorDoubleSide : priceConfig.colorSingleSide;
    return `Color ${mode}: ₹${price}/page`;
  }
}
