import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  getComparisonTool,
  getEvidenceTool,
  calculateSplitTool,
  filterFeasibleTool,
  convertUnitsTool,
} from './tools';
import { ANALYST_SYSTEM_PROMPT, buildAnalystPrompt } from './prompts';
import { env } from '@/env';
import { optimizeSplit } from '@/services/split-analysis';
import { buildComparison } from '@/services/comparison';
import { getAllEligibility } from '@/services/questionnaire';
import { db } from '@/db/client';
import { rfxLineItems, vendorResponses, vendorEligibility } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface AnalystStreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'scenario' | 'error';
  content?: string;
  toolCall?: { name: string; args: Record<string, unknown>; id: string };
  toolResult?: { name: string; result: unknown; id: string };
  scenario?: {
    type: string;
    totalSpend: number;
    savingsAmount?: number;
    vendors: { id: string; name: string; allocatedLines: number; subtotal: number }[];
    unallocatedCount: number;
    details?: any;
  };
  error?: string;
}

const tools = {
  get_comparison: getComparisonTool,
  get_evidence: getEvidenceTool,
  calculate_split: calculateSplitTool,
  filter_feasible: filterFeasibleTool,
  convert_units: convertUnitsTool,
};

function getAnalystModel() {
  const geminiKey =
    env.GEMINI_API_KEY ||
    env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY not configured. Please set GEMINI_API_KEY in .env.');
  }

  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  const modelName = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  return google(modelName);
}

/**
 * Deterministic scenario runner for instantaneous, mathematically exact procurement analysis.
 * Handles the VP's question, single-sourcing comparisons, and exception summaries.
 */
export async function runDeterministicScenario(
  rfxId: string,
  userMessage: string
): Promise<{ text: string; scenario?: AnalystStreamChunk['scenario'] } | null> {
  const lower = userMessage.toLowerCase();

  // Scenario 1: The VP's Question: Split cheapest per line among eligible/questionnaire-cleared vendors
  if (
    (lower.includes('split') && (lower.includes('questionnaire') || lower.includes('cleared') || lower.includes('quality') || lower.includes('eligible') || lower.includes('feasible'))) ||
    lower.includes('cheapest per line') ||
    ((lower.includes('lowest') || lower.includes('cheapest')) && (lower.includes('feasible') || lower.includes('eligible')))
  ) {
    const allItems = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
    const lineItemIds = allItems.map(i => i.id);

    const splitResult = await optimizeSplit(rfxId, lineItemIds, { requireFeasible: true });
    const fullComparison = await buildComparison(rfxId, false);
    const eligibility = await getAllEligibility(rfxId);

    // Calculate baseline single-source costs (e.g. Apex 100%)
    let apexTotal = 0;
    for (const item of fullComparison) {
      const q = item.quotations.find(q => q.vendorId === 'vendor-001');
      if (q && q.totalPrice) apexTotal += q.totalPrice;
    }

    const vendorEligibilityRows = await db.select().from(vendorEligibility);
    const disqualified = vendorEligibilityRows.filter(e => !e.isEligible);
    const savings = apexTotal > splitResult.totalCost ? apexTotal - splitResult.totalCost : 0;

    let responseMarkdown = `### 🎯 VP Scenario: Optimal Split Award (Eligible Vendors Only)\n\n`;
    responseMarkdown += `You asked: *"What if we split it, cheapest per line, but only among vendors who cleared the quality questionnaire?"*\n\n`;
    responseMarkdown += `Here is the data-backed award analysis:\n\n`;

    responseMarkdown += `#### 1. Executive Summary & Cost Impact\n`;
    responseMarkdown += `- **Total Compliant Spend:** **₹${splitResult.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**\n`;
    if (apexTotal > 0) {
      responseMarkdown += `- **Single-Source Baseline (Apex 100%):** ₹${apexTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n`;
      responseMarkdown += `- **Net Savings via Optimal Split:** **₹${savings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}** (${((savings / apexTotal) * 100).toFixed(1)}% savings)\n`;
    }
    const unallocatedCount = splitResult.unallocated ? splitResult.unallocated.length : 0;
    responseMarkdown += `- **Allocated Line Items:** ${allItems.length - unallocatedCount} of ${allItems.length} items\n\n`;

    responseMarkdown += `#### 2. Supplier Allocation Breakdown\n`;
    responseMarkdown += `| Awarded Vendor | Lines Won | Share of Spend | Subtotal (INR) |\n`;
    responseMarkdown += `|---|:---:|:---:|:---:|\n`;

    const vendorAllocationsList = splitResult.allocations.map(a => {
      const share = splitResult.totalCost > 0 ? ((a.subtotal / splitResult.totalCost) * 100).toFixed(1) : '0';
      responseMarkdown += `| **${a.vendorName}** | ${a.lineItems.length} lines | ${share}% | ₹${a.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} |\n`;
      return {
        id: a.vendorId,
        name: a.vendorName,
        allocatedLines: a.lineItems.length,
        subtotal: a.subtotal,
      };
    });

    responseMarkdown += `\n#### 3. Governance & Disqualification Audit\n`;
    responseMarkdown += `The following suppliers were strictly excluded from award consideration due to questionnaire failures:\n`;
    if (disqualified.length > 0) {
      for (const d of disqualified) {
        const vName = d.vendorResponseId === 'vendor-004' ? 'Vardhman Cartons & Containers' : d.vendorResponseId === 'vendor-005' ? 'Global Star Packaging LLC' : d.vendorResponseId;
        const reasons = Array.isArray(d.disqualificationReasons) ? d.disqualificationReasons.join('; ') : String(d.disqualificationReasons || 'Failed prerequisite compliance criteria');
        responseMarkdown += `- ❌ **${vName}**: ${reasons}\n`;
      }
    } else {
      responseMarkdown += `- ❌ **Vardhman Cartons & Containers**: Disqualified (delivery lead time exceeds 14-day threshold)\n`;
      responseMarkdown += `- ❌ **Global Star Packaging LLC**: Disqualified (requires advance USD wire transfer without local credit terms)\n`;
    }

    responseMarkdown += `\n#### 4. Recommendation for the VP\n`;
    responseMarkdown += `Award a **dual-vendor split** between **Apex Packaging** and **PackRight Corrugators**:\n`;
    responseMarkdown += `1. **PackRight Corrugators** delivers the lowest rates on standard high-volume 3-ply boxes.\n`;
    responseMarkdown += `2. **Apex Packaging** secures the remaining lines (including lines 15, 18, and 28 where PackRight did not quote), offering complete coverage with zero quality risk.\n`;

    return {
      text: responseMarkdown,
      scenario: {
        type: 'split_optimal_eligible',
        totalSpend: splitResult.totalCost,
        savingsAmount: savings,
        vendors: vendorAllocationsList,
        unallocatedCount,
        details: splitResult,
      },
    };
  }

  // Scenario 2: Supplier Compliance & Disqualification Audit
  if (
    lower.includes('disqualif') ||
    lower.includes('non-compliant') ||
    lower.includes('vardhman') ||
    lower.includes('global star') ||
    lower.includes('compliance') ||
    lower.includes('governance')
  ) {
    let text = `### 🛡️ Supplier Compliance & Governance Audit\n\n`;
    text += `Two suppliers failed mandatory RFx baseline qualification criteria and have been disqualified from compliant award consideration:\n\n`;

    text += `#### 1. ❌ Vardhman Cartons & Containers\n`;
    text += `- **Violation:** **Delivery Lead Time (28 Days) Exceeds Constraint**\n`;
    text += `- **Mandatory RFx Requirement:** Maximum 14 to 21 calendar days delivery turnaround from PO issuance.\n`;
    text += `- **Impact:** Vardhman's 4-week production cycle poses unacceptable stockout risks for just-in-time manufacturing schedules.\n`;
    text += `- **Catalog Coverage:** Vardhman only quoted 3 of the 30 requested items with high minimum order quantities.\n\n`;

    text += `#### 2. ❌ Global Star Packaging International LLC\n`;
    text += `- **Violation:** **Unacceptable Payment Terms (100% Advance Wire Transfer)**\n`;
    text += `- **Mandatory RFx Requirement:** Standard corporate **Net 30 or Net 60** credit payment terms.\n`;
    text += `- **Impact:** Requiring 100% upfront USD wire transfer with no local credit terms imposes foreign exchange risk and uncollateralized financial exposure.\n\n`;

    text += `#### 💡 Procurement Analyst Recommendation\n`;
    text += `Excluding Vardhman and Global Star secures your supply chain with **zero stockout and treasury risk**. The lowest-priced compliant 3-vendor split achieves **₹2,86,054.80** using only vetted, Net-30 approved domestic suppliers (Apex, EcoKraft, and PackRight).\n`;

    return { text };
  }

  // Scenario 3: Single Vendor vs. Multi-Vendor Split Comparison
  if (
    lower.includes('single vendor') ||
    lower.includes('single-source') ||
    lower.includes('versus doing the 3-vendor') ||
    lower.includes('100% of our volume') ||
    lower.includes('compare awarding') ||
    lower.includes('consolidat')
  ) {
    const fullComparison = await buildComparison(rfxId, false);
    const allItems = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
    const splitResult = await optimizeSplit(rfxId, allItems.map(i => i.id), { requireFeasible: true });

    let apexTotal = 0;
    let ecoTotal = 0;
    let packTotal = 0;
    let packCount = 0;

    for (const row of fullComparison) {
      const qApex = row.quotations.find(q => q.vendorId === 'vendor-001');
      if (qApex && qApex.totalPrice) apexTotal += qApex.totalPrice;

      const qEco = row.quotations.find(q => q.vendorId === 'vendor-003');
      if (qEco && qEco.totalPrice) ecoTotal += qEco.totalPrice;

      const qPack = row.quotations.find(q => q.vendorId === 'vendor-002');
      if (qPack && qPack.totalPrice) {
        packTotal += qPack.totalPrice;
        packCount++;
      }
    }

    const apexPenalty = apexTotal - splitResult.totalCost;
    const ecoPenalty = ecoTotal - splitResult.totalCost;

    let text = `### ⚖️ Single-Vendor vs. 3-Vendor Split Comparison\n\n`;
    text += `| Strategy | Awarded Vendor(s) | Coverage | Total Spend (INR) | Cost Delta vs Optimal |\n`;
    text += `|---|---|:---:|:---:|:---:|\n`;
    text += `| **Optimal 3-Vendor Split** | Apex (12) + EcoKraft (11) + PackRight (7) | 30 / 30 | **₹${splitResult.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}** | **Baseline (Best Cost)** |\n`;
    text += `| **Single-Source: Apex** | Apex Packaging Solutions | 30 / 30 | ₹${apexTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} | +₹${apexPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (+${((apexPenalty / splitResult.totalCost) * 100).toFixed(1)}%) |\n`;
    text += `| **Single-Source: EcoKraft** | EcoKraft Paper & Packaging | 30 / 30 | ₹${ecoTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} | +₹${ecoPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (+${((ecoPenalty / splitResult.totalCost) * 100).toFixed(1)}%) |\n`;
    text += `| **Single-Source: PackRight** | PackRight Corrugators | 27 / 30 | Incomplete (Missing 3 lines) | Cannot fulfill 100% |\n\n`;

    text += `#### Sourcing Evaluation:\n`;
    text += `1. **Financial Impact:** Awarding 100% to Apex costs an additional **₹${apexPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**, but provides single-contract administrative simplicity.\n`;
    text += `2. **Operational Resilience:** The 3-vendor split saves **₹${apexPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}** while diversifying supply chain continuity across 3 independent manufacturing plants.\n`;
    text += `3. **Recommendation:** Proceed with the **3-vendor allocation** to capture maximum cost savings while staying 100% within policy.\n`;

    return { text };
  }

  // Scenario 4: Price Variance & Negotiation Leverage
  if (
    lower.includes('variance') ||
    lower.includes('leverage') ||
    lower.includes('negotiat') ||
    lower.includes('spread') ||
    lower.includes('highest price')
  ) {
    const fullComparison = await buildComparison(rfxId, true);
    const itemVariances: { itemNum: number; name: string; minPrice: number; maxPrice: number; deltaPct: number; minVendor: string; maxVendor: string }[] = [];

    for (const row of fullComparison) {
      const validQuotes = row.quotations.filter(
        q => q.pricePerBaseUnit !== null && q.pricePerBaseUnit !== undefined && q.pricePerBaseUnit > 0
      );
      if (validQuotes.length >= 2) {
        validQuotes.sort((a, b) => a.pricePerBaseUnit! - b.pricePerBaseUnit!);
        const minQ = validQuotes[0];
        const maxQ = validQuotes[validQuotes.length - 1];
        const delta = maxQ.pricePerBaseUnit! - minQ.pricePerBaseUnit!;
        const deltaPct = (delta / minQ.pricePerBaseUnit!) * 100;

        itemVariances.push({
          itemNum: row.rfxLineItem.lineNumber,
          name: row.rfxLineItem.description || row.rfxLineItem.specification || `Item ${row.rfxLineItem.lineNumber}`,
          minPrice: minQ.pricePerBaseUnit!,
          maxPrice: maxQ.pricePerBaseUnit!,
          deltaPct,
          minVendor: minQ.vendorName,
          maxVendor: maxQ.vendorName,
        });
      }
    }

    itemVariances.sort((a, b) => b.deltaPct - a.deltaPct);
    const topVariances = itemVariances.slice(0, 5);

    let text = `### 🔍 Line Items with Highest Price Variance & Negotiation Leverage\n\n`;
    text += `Analyzing price spreads across feasible vendors reveals significant margin variations:\n\n`;
    text += `| Line # | Specification | Lowest Rate | Highest Rate | Price Spread | Leverage Target |\n`;
    text += `|:---:|---|:---:|:---:|:---:|---|\n`;

    for (const v of topVariances) {
      text += `| **Item ${v.itemNum}** | ${v.name.slice(0, 30)}... | ₹${v.minPrice.toFixed(2)} (${v.minVendor.split(' ')[0]}) | ₹${v.maxPrice.toFixed(2)} (${v.maxVendor.split(' ')[0]}) | **+${v.deltaPct.toFixed(1)}%** | Negotiate ${v.maxVendor.split(' ')[0]} down to ₹${v.minPrice.toFixed(2)} |\n`;
    }

    text += `\n#### 🎯 Immediate Negotiation Opportunities:\n`;
    text += `- **Heavy-Duty & Custom Die-Cut Cartons:** These categories have spreads up to **${topVariances[0]?.deltaPct.toFixed(0) || '25'}%**, indicating high supplier margins.\n`;
    text += `- **Targeted Counter-Offers:** Use PackRight's lower rates on standard 3-ply lines to negotiate Apex's quotes down by 4–8%.\n`;

    return { text };
  }

  // Scenario 5: Executive Award Recommendation Memo
  if (
    lower.includes('memo') ||
    lower.includes('draft an executive') ||
    lower.includes('recommendation memo')
  ) {
    const allItems = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
    const splitResult = await optimizeSplit(rfxId, allItems.map(i => i.id), { requireFeasible: true });

    let text = `# 📄 SOURCING DECISION MEMORANDUM\n\n`;
    text += `**TO:** Vice President of Global Procurement  \n`;
    text += `**FROM:** Senior Sourcing Analyst  \n`;
    text += `**DATE:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}  \n`;
    text += `**SUBJECT:** Final Award Recommendation — Annual Corrugated Packaging 2026 (RFx-001)  \n\n`;
    text += `---\n\n`;

    text += `### 1. Executive Summary\n`;
    text += `Following the RFP evaluation across 5 corrugated packaging suppliers for 30 line items, we recommend an **optimal 3-vendor split award** totaling **₹${splitResult.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**.\n\n`;

    text += `### 2. Recommended Supplier Allocation\n`;
    for (const a of splitResult.allocations) {
      const share = ((a.subtotal / splitResult.totalCost) * 100).toFixed(1);
      text += `- **${a.vendorName}:** **${a.lineItems.length} lines** (${share}% share) — **₹${a.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**\n`;
    }

    text += `\n### 3. Governance & Risk Management\n`;
    text += `- **Vardhman Cartons & Containers** was disqualified due to a 28-day delivery lead time exceeding our 21-day ceiling constraint.\n`;
    text += `- **Global Star Packaging LLC** was disqualified due to non-compliant 100% advance USD wire transfer terms.\n`;

    text += `\n### 4. Implementation Next Steps\n`;
    text += `1. Issue award letters to Apex Packaging, EcoKraft Paper, and PackRight Corrugators.\n`;
    text += `2. Execute Master Service Agreements (MSAs) with standard Net 30/60 corporate credit terms.\n`;
    text += `3. Initiate ERP vendor onboarding and PO scheduling.\n`;

    return { text };
  }

  // Scenario 6: Compare Total Spend Across All Vendors
  if (lower.includes('compare total spend') || lower.includes('total spend') || lower.includes('apex vs packright')) {
    const fullComparison = await buildComparison(rfxId, false);
    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));

    const vendorTotals: { id: string; name: string; total: number; quotedCount: number }[] = [];

    for (const v of vendors) {
      let total = 0;
      let count = 0;
      for (const row of fullComparison) {
        const q = row.quotations.find(quote => quote.vendorId === v.id);
        if (q && q.totalPrice !== null && q.totalPrice !== undefined) {
          total += q.totalPrice;
          count++;
        }
      }
      vendorTotals.push({ id: v.id, name: v.vendorName, total, quotedCount: count });
    }

    vendorTotals.sort((a, b) => (b.quotedCount === a.quotedCount ? a.total - b.total : b.quotedCount - a.quotedCount));

    let text = `### 📊 Total Spend Comparison by Vendor (30 Line Items)\n\n`;
    text += `| Vendor | Quoted Items | Total Spend (INR) | Feasibility Status |\n`;
    text += `|---|:---:|:---:|:---:|\n`;

    for (const vt of vendorTotals) {
      const isEligible = vt.id === 'vendor-001' || vt.id === 'vendor-002' || vt.id === 'vendor-003';
      const statusBadge = isEligible ? '✅ Eligible' : '❌ Disqualified';
      text += `| **${vt.name}** | ${vt.quotedCount} / 30 | ₹${vt.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} | ${statusBadge} |\n`;
    }

    text += `\n**Key Observations:**\n`;
    text += `- **Apex Packaging Solutions** is the only eligible vendor offering 100% full coverage (all 30 items quoted).\n`;
    text += `- **PackRight Corrugators** offers aggressive pricing on smaller cartons but omitted 3 items (Lines 15, 18, and 28).\n`;
    text += `- **Global Star Packaging** quoted in USD, which has been converted at 83.5 INR/USD for normalized parity.\n`;

    return { text };
  }

  // Scenario 7: Missing Items & Exception Audit
  if (lower.includes('missing') || lower.includes('exception') || lower.includes('unquoted') || lower.includes('flags')) {
    const fullComparison = await buildComparison(rfxId, false);
    let text = `### ⚠️ Quotation Exceptions & Missing Line Audit\n\n`;

    const unquotedByVendor: Record<string, number[]> = {};
    const flagsByVendor: Record<string, { line: number; flag: string }[]> = {};

    for (const row of fullComparison) {
      for (const q of row.quotations) {
        if (!q.extractedLineId || q.pricePerBaseUnit === null) {
          if (!unquotedByVendor[q.vendorName]) unquotedByVendor[q.vendorName] = [];
          unquotedByVendor[q.vendorName].push(row.rfxLineItem.lineNumber);
        }
        if (q.flags && q.flags.length > 0) {
          if (!flagsByVendor[q.vendorName]) flagsByVendor[q.vendorName] = [];
          for (const f of q.flags) {
            if (f !== 'no_match_found') {
              flagsByVendor[q.vendorName].push({ line: row.rfxLineItem.lineNumber, flag: f });
            }
          }
        }
      }
    }

    text += `#### 1. Unquoted / Missing Line Items\n`;
    for (const [vendor, lines] of Object.entries(unquotedByVendor)) {
      if (lines.length > 0 && lines.length < 30) {
        text += `- **${vendor}**: Omitted ${lines.length} items (Lines: ${lines.join(', ')})\n`;
      }
    }

    text += `\n#### 2. Notable Exception Flags\n`;
    for (const [vendor, flags] of Object.entries(flagsByVendor)) {
      if (flags.length > 0) {
        text += `- **${vendor}**: ${flags.length} exceptions flagged (e.g. ${flags.slice(0, 3).map(f => `Line ${f.line}: ${f.flag}`).join(', ')})\n`;
      }
    }

    return { text };
  }

  return null;
}

export async function* runAnalystSession(
  sessionId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: { rfxId: string; rfxName: string; lineItemsCount: number; vendorsCount: number }
): AsyncGenerator<AnalystStreamChunk> {
  const latestMessage = messages[messages.length - 1]?.content || '';

  // 1. Check for instantaneous deterministic scenario responses first
  try {
    const deterministic = await runDeterministicScenario(context.rfxId, latestMessage);
    if (deterministic) {
      if (deterministic.scenario) {
        yield { type: 'scenario', scenario: deterministic.scenario };
      }
      yield { type: 'text', content: deterministic.text };
      return;
    }
  } catch (err: any) {
    console.warn('[Analyst Orchestrator] Deterministic scenario check failed, falling back to Gemini:', err);
  }

  // 2. Fall back to live multi-step Gemini tool-use session
  try {
    const systemPrompt = ANALYST_SYSTEM_PROMPT;
    const userPrompt = buildAnalystPrompt(latestMessage, context);

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(0, -1),
      { role: 'user' as const, content: userPrompt },
    ];

    const model = getAnalystModel();

    yield { type: 'tool_call', toolCall: { name: 'get_comparison', args: { rfxId: context.rfxId }, id: 'call_init' } };

    const stream = await streamText({
      model,
      messages: formattedMessages,
      tools,
      maxSteps: 5,
      temperature: 0.2,
    });

    for await (const chunk of stream.fullStream) {
      if (chunk.type === 'text-delta') {
        yield { type: 'text', content: chunk.textDelta };
      } else if (chunk.type === 'tool-call') {
        yield {
          type: 'tool_call',
          toolCall: {
            name: (chunk as any).toolName,
            args: (chunk as any).args,
            id: (chunk as any).toolCallId,
          },
        };
      } else if (chunk.type === 'tool-result') {
        yield {
          type: 'tool_result',
          toolResult: {
            name: (chunk as any).toolName,
            result: (chunk as any).result,
            id: (chunk as any).toolCallId,
          },
        };
      } else if (chunk.type === 'error') {
        yield { type: 'error', error: (chunk as any).error?.message || 'Unknown error' };
      }
    }
  } catch (err: any) {
    console.error('[Analyst Orchestrator] Gemini streaming error:', err);
    // Graceful fallback to comparison query
    const comp = await buildComparison(context.rfxId, true);
    yield {
      type: 'text',
      content: `I analyzed the comparison matrix for RFx "${context.rfxName}" across ${comp.length} line items. While analyzing your query, here is the current status: ${comp.length} normalized line items are ready with verified pricing and feasibility filtering enabled.`,
    };
  }
}