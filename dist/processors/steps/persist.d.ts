import type { ExtractionResult } from '@/ai/extraction/schemas';
import type { RFxLineItem, SourceDoc, VendorResponse } from '@/domain/types';
export declare function persistExtraction(vendorResponse: VendorResponse, sourceDoc: SourceDoc, rfxLineItems: RFxLineItem[], result: ExtractionResult): Promise<void>;
//# sourceMappingURL=persist.d.ts.map