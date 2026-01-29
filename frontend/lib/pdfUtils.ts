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
 * Count the number of pages in a PDF file
 */
export async function countPdfPages(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log(`[PDF] Counting pages for ${file.name}, size: ${arrayBuffer.byteLength} bytes`);
    
    // Try to parse the PDF
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    console.log(`[PDF] Successfully read ${file.name}: ${pageCount} pages`);
    
    // Clean up
    pdf.destroy();
    
    return pageCount;
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    
    // Fallback: try alternative parsing
    try {
      console.log('[PDF] Attempting fallback parsing method...');
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Count /Page objects in PDF - rough estimation as fallback
      const text = new TextDecoder().decode(uint8Array);
      const pageMatches = text.match(/\/Type\s*\/Page\s*[^/]*/g) || [];
      
      if (pageMatches.length > 0) {
        console.log(`[PDF] Fallback found approximately ${pageMatches.length} pages`);
        return Math.max(1, pageMatches.length);
      }
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError);
    }
    
    // If all else fails, return 1
    console.warn('[PDF] Could not determine page count, defaulting to 1');
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
