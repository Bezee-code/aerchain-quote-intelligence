# Aerchain Product Management Take-Home Assignment
## "Kill the Quote Spreadsheet" — Product Decisions & Trade-Offs Note

**Author:** Souvik Ghosh  
**Target Category:** Corrugated Packaging Procurement (30 Line Items × 5 Competing Suppliers)  
**Deliverable:** 1-Page Executive Product Note  

---

### 1. The Problem We Set Out to Solve
Every procurement team suffers through the "lost week" of quotation normalization. Buyers issue an RFx and receive 5 completely unstandardized responses: an Excel that discarded the template, a PDF with discounts hidden in footnotes, a Word doc with commercial terms written in narrative prose, a skewed phone photo of a paper rate sheet, and an email quoted in foreign currency.

Buyers spend days manually transcribing rows into spreadsheets, only to be paralyzed when leadership asks a single multi-variable question:
> *"What if we split the award, cheapest per line, but only among vendors who cleared our quality questionnaire?"*

Our goal was to build a single, end-to-end prototype where quotation values strictly originate from real document intelligence, and a buyer can interrogate the resulting comparison matrix in plain language.

---

### 2. Key Product Decisions We Made (And Why)

#### A. Unified Comparative Matrix over Disconnected Supplier Cards
* **Decision**: We designed the primary Comparison Workspace as a dense, high-information-density matrix (30 line items on rows, 5 competing vendors on columns).
* **Rationale**: Sourcing decisions are inherently comparative. Buyers do not review vendors in isolation; they compare unit rates, minimum order quantities, and exceptions horizontally. A tabular grid with dynamic green "Cheapest" indicators allows an experienced category manager to absorb 150 price points in seconds.

#### B. Zero-Hallucination Auditability: Cell-Level Provenance & Verification
* **Decision**: Every cell in the comparison matrix is clickable, opening a **Quotation Cell Provenance & Review** modal displaying the ExtractedLine ID, AI confidence score, verbatim document snippet (e.g. `"INR 22.50"`, `"Payment terms Net 30 days"`), and an immediate Buyer Override form.
* **Rationale**: *Would a buyer with ₹4 crore on the line trust a black-box AI?* Absolutely not. Procurement professionals require defensible audit trails. Showing the exact text snippet from the raw document bridges the trust gap from "experimental AI" to enterprise-grade software.

#### C. Real Multi-Format Document Ingestion (No Faked Data)
* **Decision**: We implemented live multimodal document processing combining Tesseract OCR, PDF table parsers, Word document extractors, email RFC-822 parsers, and Google Gemini vision extraction with resilient automated model fallbacks.
* **Rationale**: The brief's core directive was: *"Stub the plumbing, but the AI loops must be real."* The prototype contains zero hardcoded quotation values. When demo responses are loaded, raw files (`.xlsx`, `.pdf`, `.docx`, `.png`, `.eml`) pass through real parsing, entity extraction, RFx line item matching, and currency normalization in real time.

#### D. The Conversational Co-Pilot (The "Analyst" Tab)
* **Decision**: We built a dedicated Procurement Analyst co-pilot with quick-prompt scenario chips and real calculation tools (`calculateSplit`, `filterFeasible`, `getComparison`).
* **Rationale**: Moving from manual Excel formulas to natural language decision modeling directly answers the VP's question in seconds, computing the optimal compliant split spend (₹2,86,054.8), vendor allocation (Apex: 12 lines, EcoKraft: 11 lines, PackRight: 7 lines), and governance exclusions.

---

### 3. What We Deliberately Left Out (And Why)

1. **Pre-RFx Vendor Discovery & Directory Sourcing**:
   - *Why left out*: The highest-friction pain point in procurement is not finding 5 suppliers, but comparing the 5 messy responses they send back. We focused 100% of engineering bandwidth on post-RFx quote intelligence.
2. **Automated SMTP Email Server Infrastructure**:
   - *Why left out*: The brief explicitly authorized stubbing SMTP servers. Building email authentication (SPF, DKIM) and inbox polling would consume days of plumbing without advancing the quote intelligence mission.
3. **Downstream ERP Purchase Order / Contract Generation**:
   - *Why left out*: Once a defensible award decision is reached, pushing PO lines into SAP or Oracle is standardized IT plumbing. We focused on the intelligence layer that creates the decision memo.

---

### 4. Where the "Better Problem" Actually Was

Going into this assignment, one might assume the primary challenge is pure OCR and named entity recognition (extracting numbers from messy PDFs).

**The more interesting problem is Contractual Normalization & Governance Risk:**
* A vendor might quote the lowest nominal rate per box (e.g. Vardhman), but their delivery lead time of 25 days would cause factory shutdown costs that dwarf any box savings.
* Another vendor quotes in USD wire transfer (Global Star), introducing foreign exchange exposure and credit risks.
* PackRight offers the cheapest rates on standard boxes but quietly omitted 3 specialty cartons.

Real quote intelligence is not just copying numbers from paper to screen — it is **translating unstructured commercial offers into standardized, risk-adjusted total cost of ownership (TCO)** that a procurement board can defend.
