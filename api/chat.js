/* ===========================================================================
   api/chat.js — the model half of the project assistant

   Retrieval still happens in the browser: the client already holds kb.js, so
   it picks the relevant chunks and posts them here as context. This function
   turns that context into an answer and streams it back.

   That split matters for trust. Citations stay deterministic — they come from
   the retrieval engine, not from the model — so the model cannot invent a
   source. Its job is only to phrase an answer over passages it was handed.

   Requires AI_GATEWAY_API_KEY in the Vercel project (or OIDC on Vercel).
   Falls back to the client's local composition when unavailable.
   =========================================================================== */

import { streamText } from 'ai';

const MODEL = 'anthropic/claude-sonnet-5';

/* The GitHub Pages copy of the site is a different origin, so it is allowed
   to call this endpoint too. Set ALLOWED_ORIGINS to override. */
const DEFAULT_ORIGINS = [
  'https://spenchh.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8795',
  'http://127.0.0.1:8795',
];

function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const list = allowed.length ? allowed : DEFAULT_ORIGINS;
  const ok = origin && list.some(o => origin === o);
  return {
    'Access-Control-Allow-Origin': ok ? origin : list[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

/* --------------------------------------------------------------- prompting */

const RULES = `
You are the project assistant for SURG 2026, a student research project building an
FPGA-based field-oriented-control motor controller. You answer questions from one
engineer's own project notes, RTL and MATLAB sources.

HOW TO ANSWER
- Answer the exact question asked, in the first sentence. Do not open with background.
- Be short by default. Two to four sentences is usually right. Expand only when the
  question genuinely needs it, or when the mode asks for it.
- Prefer project-specific facts over general engineering explanation. If someone asks
  what a Clarke transform is, explain it using this project's actual signals and files
  before any textbook framing.
- Write in plain engineering language. No marketing tone, no filler, no restating the
  question back.
- Cite the file you used inline, like (PCB_CROSSCHECK_2026-08-05.md) or
  (fpga/rtl/hall_decoder.v). Only cite files that appear in the CONTEXT below.
- Separate what is Confirmed, what is Inferred, and what is Open whenever the answer
  touches more than one of those. Say which is which.
- If the context does not settle the question, say so plainly and say what would settle
  it. Never fill a gap with plausible reasoning presented as fact.
- If asked what to do next, give concrete project tasks in priority order, and say which
  are blocked and on whom.

THINGS THAT ARE TRUE AND MUST NEVER BE CONTRADICTED
- Nothing has ever been simulated. Six RTL modules and six testbenches exist; no
  simulator has executed them. Vivado, xvlog, xelab, iverilog and verilator were all
  absent from PATH when last checked.
- Nothing has been tested on hardware. The PCB has not been fabricated. There are no
  scope captures, no bring-up logs, no photographs of a powered board.
- The PCB has not been signed off and is not confirmed safe to order.
- Board facts come from a text extraction of the Altium netlist. That is not visual DRC,
  layout review, or symbol verification.
- The control model produces three duty commands (duty_a, duty_b, duty_c). The FPGA
  expands those into six physical HI/LO driver-input pins. This has always been the
  architecture — never describe 3PWM as a new or recent decision.
- The near-term direction is Hall-assisted FOC and board bring-up. Sensorless FOC is
  future research, not what is implemented. Never say the project is doing sensorless FOC.
- Three Hall sensors resolve rotor angle only to within 60 degrees. Never imply Halls
  give a precise or perfect rotor angle for FOC.
- DISABLE is active high: drive it LOW to run, HIGH to inhibit.
- No nOC or FAULT nets exist on the updated board.
- The interactive models on the site are JavaScript reimplementations written to explain
  intent. They are not simulator output and are not evidence the RTL behaves this way.

If a question asks you to confirm any of the above as done, tested, working or safe,
correct the premise directly.
`.trim();

const MODE_PROMPTS = {
  quick: 'Answer in two or three sentences. Lead with the fact. No preamble.',
  new: 'The reader has no background in this project. Explain in plain language, defining any term the moment you use it. Still lead with the direct answer, then build up. Around six sentences.',
  fpga: 'Answer from the implementation side. Reference actual module names, ports, parameters and signal names from the RTL in the context. Quote short snippets where it helps. Say what is not yet written.',
  pcb: 'Answer from the board side. Reference net names, header positions, component designators and the extracted netlist. Be explicit about what the extraction can and cannot establish.',
  math: 'Answer from the control-math side. Reference the MATLAB scripts, the Q-format conventions and the actual coefficient values in the context. Show the arithmetic where it clarifies.',
  meeting: 'Write what the engineer could say out loud in a supervisor meeting: first person, natural spoken sentences, no bullet points. Cover what is confirmed, what changed, and what is blocked. End by stating plainly that nothing has been simulated or tested.',
};

function buildContext(chunks) {
  return chunks.map((c, i) => {
    const where = c.lines ? `:${c.lines[0]}-${c.lines[1]}` : '';
    const tier = c.tier === 1 ? 'PROJECT FILE' : c.tier === 2 ? 'DATASHEET' : c.tier === 3 ? 'OFFICIAL DOCS' : c.tier === 4 ? 'APP NOTE' : 'VIDEO (learning aid only)';
    const stale = c.superseded ? ' [SUPERSEDED — describes an older board revision, do not present as current]' : '';
    return `[${i + 1}] ${tier} · ${c.file}${where} · ${c.heading || ''} · status=${c.status}${c.updated ? ` · updated=${c.updated}` : ''}${stale}
${(c.text || c.code || '').slice(0, 1800)}`;
  }).join('\n\n---\n\n');
}

/* -------------------------------------------------------------- handler */

export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    // The client treats this as "no AI available" and uses its local answer.
    return new Response(JSON.stringify({ error: 'no_model_configured' }),
      { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); }
  catch { return new Response('Bad JSON', { status: 400, headers: cors }); }

  const question = String(body.question || '').slice(0, 2000).trim();
  const mode = MODE_PROMPTS[body.mode] ? body.mode : 'quick';
  const chunks = Array.isArray(body.chunks) ? body.chunks.slice(0, 10) : [];
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  if (!question) return new Response('Missing question', { status: 400, headers: cors });

  const context = chunks.length
    ? buildContext(chunks)
    : '(No matching passages were retrieved from the project files.)';

  const system = `${RULES}

ANSWER MODE: ${MODE_PROMPTS[mode]}

CONTEXT — passages retrieved from the project. These are the only sources you may cite.
Ranking is already applied: project files outrank datasheets, which outrank official
docs, which outrank application notes. Video is a learning aid and never evidence.

${context}`;

  try {
    const result = streamText({
      model: MODEL,
      system,
      messages: [
        ...history
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
          .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
        { role: 'user', content: question },
      ],
      temperature: 0.2,          // this is a documentation lookup, not a brainstorm
      maxOutputTokens: 1200,
    });

    return result.toTextStreamResponse({
      headers: { ...cors, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'model_failed', detail: String(err && err.message || err) }),
      { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}
