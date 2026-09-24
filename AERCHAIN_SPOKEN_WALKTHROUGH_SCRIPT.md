# Aerchain Quote Intelligence — 5-6 Minute Spoken Walkthrough Script

**Topic:** "Kill the Quote Spreadsheet" — Autonomous Quotation Ingestion & Decision Intelligence  
**Target Category:** Corrugated Packaging Annual Procurement 2026 (30 Line Items × 5 Competing Suppliers)  
**Presenter:** Souvik Ghosh  
**Target Duration:** 5 to 6 Minutes (~750 words at 130–140 WPM)  

---

## 🎙️ Verbatim Spoken Script

### [0:00 – 1:00] The Hook & "The Lost Week" in Procurement
*(Screen: Start on the homepage or header showing "Corrugated Packaging Annual Procurement 2026")*

> "Good morning everyone.
>
> Every procurement team in the enterprise suffers through what category managers call **'the lost week'** of quotation normalization.
>
> Imagine you are managing an annual RFx for corrugated packaging across 30 distinct manufacturing SKUs—from standard single-wall cartons to heavy-duty export containers. You issue your RFx to five qualified suppliers, and what comes back is absolute chaos:
>
> * One supplier sends an **Excel sheet** that completely ignored your template.
> * Another sends a **PDF** with discounts and freight fees hidden in the footnotes.
> * The third sends a **Word document** with commercial terms written as legal prose.
> * The fourth sends a **smartphone photo of a printed paper rate card**.
> * And the fifth sends an **email** quoted in US Dollars with non-standard payment terms.
>
> Before a buyer can make even a single decision, they spend 30 to 40 hours manually copying numbers into a master spreadsheet, wrestling with currency conversions, and fixing unit mismatches. And when leadership asks: *'What is our optimal split-award if we only buy from vendors who meet our quality criteria?'*, the buyer is back to square one, building fragile VLOOKUP formulas from scratch.
>
> Today, I’m showing you **Aerchain Quote Intelligence**—a solution built to replace that lost week with minutes of auditable, automated decision intelligence."

---

### [1:00 – 2:00] Real Multimodal Ingestion & Edge Cases
*(Action: Click on the "Responses" tab to display the Response Roster with all 5 vendors)*

> "Let's look at the **Responses** tab.
>
> Under the hood, we are not using mocked data or static JSON fixtures. Every single quotation here comes from a real document processed through our multimodal extraction pipeline.
>
> Notice the five different formats:
> 1. **Apex Packaging** submitted a `.xlsx` spreadsheet.
> 2. **PackRight Corrugators** submitted a `.pdf`.
> 3. **EcoKraft** submitted a `.docx` contract.
> 4. **Vardhman Cartons** submitted a raw `.png` image requiring OCR.
> 5. And **Global Star** submitted a `.eml` email file.
>
> Our ingestion engine doesn't just read tables—it identifies real-world **commercial edge cases** in real time:
>
> * **PackRight** only quoted 27 out of 30 line items—deliberately omitting items 15, 18, and 28. The system detects this partial coverage immediately without breaking downstream calculations.
> * **Vardhman's** smartphone scan had visual noise on item 5, which the system flagged as low confidence.
> * **EcoKraft** included a commercial clause tying box rates to virgin kraft paper indices from CRISIL and IPPMA.
> * And **Global Star** quoted in USD instead of our RFx base currency of Indian Rupees.
>
> All of these are parsed, flagged, and normalized into a single database schema."

---

### [2:00 – 3:15] The Normalized Comparative Matrix
*(Action: Click on the "Workspace" tab to display the 30-item grid)*

> "Now, let's switch to the **Workspace** tab. This is where the core value lies.
>
> Instead of siloed vendor cards, we give category managers a dense, high-information comparative grid: all **30 RFx line items on rows**, and all **5 competing suppliers on columns**.
>
> Take a close look at how the normalization engine handles complex units and currencies:
>
> * On **Line Item 10** (5-Ply Industrial Carton), Vardhman quoted ₹2,450 *'Per 100 Pcs'*. A naive system would compare 2,450 against 82 Rupees. Our system automatically recognized the pack specification, normalized it to **₹24.50 each**, and flagged the unit mismatch.
> * On **Line Item 14**, Vardhman provided a price but omitted the unit entirely. Rather than inventing a guess, our system flags it as *'Unit not provided'* and sets the normalized price to null so it never corrupts total spend calculations.
> * For **Global Star**, their USD quotation was converted into INR using live benchmark exchange rates, while preserving the raw dollar amount in the audit log.
>
> The dynamic green badges instantly highlight the **cheapest feasible rate per line**, giving the category manager immediate market clarity across all 150 price points."

---

### [3:15 – 4:15] Zero-Hallucination Auditability & Buyer Overrides
*(Action: Click on any matrix cell to open the "Quotation Cell Provenance & Review" drawer)*

> "Now, here is the most critical question in enterprise procurement:  
> *Would a category manager with ₹4 crore on the line trust a black-box AI?*
>
> The answer is **never**. And they shouldn’t have to.
>
> When I click on any cell in this matrix, this **Provenance Drawer** opens.
> Notice what we display:
> 1. The unique **Extracted Line ID**.
> 2. The AI's **confidence score**.
> 3. And most importantly, the **exact verbatim text snippet** extracted directly from the supplier's original document.
>
> There are zero hallucinations. If an auditor asks why a rate is ₹22.50, the buyer can point to the exact page, line, and bounding box from the raw document.
>
> Furthermore, we recognize that procurement is an active negotiation. If a buyer calls a supplier and negotiates a discount, they can enter a **Buyer Override** right here. Watch: I update the price, hit save, and the entire matrix, line total, and cheapest vendor rankings recalculate instantaneously."

---

### [4:15 – 5:15] Supplier Qualification & The AI Procurement Analyst
*(Action: Click on the "Analyst" tab)*

> "Low price means nothing if a vendor cannot deliver. That’s why quote intelligence must incorporate **governance and qualification**.
>
> In our dataset:
> * **Vardhman** quoted very cheap prices on certain cartons. But they failed our ISO 9001 requirement, have inadequate converting capacity, and quoted a **25-day delivery lead time** when our RFx maximum is 14 days. Accepting them would risk factory downtime. The system flags them as **disqualified**.
> * **Global Star** requested commercial credit terms that are pending Euler Hermes underwriting, flagging them as **unresolved**.
>
> Now we can ask our **Procurement Analyst Co-Pilot**:
> > *'What is our optimal split allocation across approved, compliant suppliers?'*
>
> With a single query, the co-pilot calculates the risk-adjusted split:
> * **Apex Packaging** wins 12 items.
> * **EcoKraft** wins 11 items.
> * **PackRight** wins 7 items.
> * Vardhman and Global Star are correctly excluded from the award recommendation.
>
> We instantly get the exact multi-sourcing spend allocation, risk summary, and board-ready award justification."

---

### [5:15 – 5:45] Conclusion
*(Action: Return to the full Workspace view)*

> "To wrap up:  
> Aerchain Quote Intelligence takes the messy reality of enterprise procurement—unstructured documents, foreign currencies, pack-size discrepancies, and compliance hurdles—and turns it into structured, auditable decision intelligence.
>
> We didn't just automate data entry; we eliminated the 'lost week', protected the enterprise against governance risks, and gave category managers the confidence to defend multi-crore sourcing awards.
>
> Thank you, and I’d be happy to take any questions or dive deeper into any part of the architecture."

---

## 📌 Speaker Quick Reference Cheat Sheet

| Parameter | Details |
| :--- | :--- |
| **Category & Scope** | Corrugated Packaging Annual Procurement 2026 (30 Line Items × 5 Competing Suppliers, ~₹4 Crore spend) |
| **Document Formats** | `.xlsx` (Apex), `.pdf` (PackRight), `.docx` (EcoKraft), `.png` (Vardhman), `.eml` (Global Star) |
| **Edge Case 1 (Omissions)** | **PackRight** omitted 3 items (Items 15, 18, 28) &rarr; Exactly 27 of 30 items quoted |
| **Edge Case 2 (Pack Unit)** | **Vardhman Item 10**: Quoted ₹2,450 *"Per 100 Pcs"* &rarr; Normalized to **₹24.50 EA** |
| **Edge Case 3 (Missing Unit)**| **Vardhman Item 14**: Price given but no unit &rarr; Tagged *"Unit not provided"*, price kept `null` |
| **Edge Case 4 (Currency)** | **Global Star**: Quoted in **USD ($0.16)** &rarr; Normalized to **INR (₹13.33)** |
| **Edge Case 5 (Escalation)** | **EcoKraft**: Commercial clause indexed to virgin kraft paper prices (CRISIL/IPPMA) |
| **Edge Case 6 (OCR Noise)** | **Vardhman Item 5**: Low-confidence OCR price (0.42 confidence) flagged for review |
| **Supplier Qualification** | **3 Pass**: Apex, PackRight, EcoKraft<br>**1 Fail**: Vardhman (No ISO, 25-day lead time vs 14d limit)<br>**1 Unresolved**: Global Star (Net 30 terms pending Euler Hermes underwriting) |
| **Optimal Split Award** | **Apex** (12 SKUs), **EcoKraft** (11 SKUs), **PackRight** (7 SKUs) |
| **Core Architecture** | Full-Stack TypeScript: Node.js / Fastify + Drizzle ORM + SQLite + Gemini Vision AI + React 18 + Vite + Tailwind CSS |
