import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    throw new Error('Failed to read PDF file. Please check if it\'s a valid PDF.');
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
