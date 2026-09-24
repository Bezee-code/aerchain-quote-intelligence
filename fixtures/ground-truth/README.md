# Aerchain Quote Intelligence — Ground Truth Dataset

## Overview
This ground-truth benchmark specifies the exact expected extraction, normalization, exception detection, and supplier qualification results for the **Corrugated Packaging Annual Procurement 2026** RFx tender.

> **CRITICAL ARCHITECTURAL GUARANTEE**: This ground truth file is strictly an evaluation benchmark and is **never** queried or referenced by the runtime extraction, matching, or normalization pipeline. All application runtime outputs are extracted independently from the raw vendor documents.

## Tender Summary
- **RFx ID**: `rfx-001`
- **Name**: Corrugated Packaging Annual Procurement 2026
- **Total Line Items**: 30
- **Total Vendors**: 5
- **Document Formats**: .xlsx (Excel), .pdf (PDF), .docx (Word), .png (OCR Rate Card Image), .eml (Email + XLSX Attachment)

## Planted Edge Cases
1. **Missing Quotation**: Vendor B (PackRight) explicitly omits items 15, 18, and 28 (quotes 27 of 30).
2. **Currency Mismatch**: Vendor E quotes all 30 items in USD. Preserves raw USD and normalizes to INR via `EXCHANGE_RATES_TO_USD`.
3. **Unit Mismatch**: Vendor D quotes Item 10 in "Per 100 Pcs" instead of "EA".
4. **Missing Unit**: Vendor D quotes Item 14 with no unit specified. Normalized pipeline leaves unit unresolved ("Unit not provided").
5. **Ambiguous Commercial Terms**:
   - Vendor B: "Freight extra at actuals"
   - Vendor C: "CRISIL Kraft Paper Price Escalation Clause"
   - Vendor D: "Taxes as applicable, unloading at consignee scope"
   - Vendor E: "EXW Nhava Sheva / FOB Port terms"
6. **Low-Confidence Extraction**: Vendor D Item 5 has noisy/blurred typography.
7. **Deterministic Supplier Qualification**:
   - **Vendor A**: PASS (ISO: true, Lead: 7d, Cap: 1200 MT, Net 30: true) -> **Eligible**
   - **Vendor B**: PASS (ISO: true, Lead: 10d, Cap: 850 MT, Net 30: true) -> **Eligible**
   - **Vendor C**: PASS (ISO: true, Lead: 5d, Cap: 950 MT, Net 30: true) -> **Eligible**
   - **Vendor D**: FAIL (ISO: false, Lead: 25d > 14d max, Cap: 350 MT < 500 MT) -> **Disqualified**
   - **Vendor E**: UNRESOLVED (Credit terms pending Euler Hermes underwriting) -> **Pending Review**
