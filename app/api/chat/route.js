import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
const MAX_MESSAGES = 8
const MAX_MESSAGE_LENGTH = 2000
const REQUEST_TIMEOUT_MS = 15000

const SYSTEM_INSTRUCTION = `
You are SafeSpace Assistant, a calm and supportive guide inside the CCTC SafeSpace student safety web app.

Your responsibilities:
- Explain how SafeSpace works.
- Help students understand when and how to submit an incident report.
- Encourage students to contact a trusted adult, counselor, teacher, or emergency service when appropriate.
- Ask short clarifying questions when the student's concern is unclear.
- Be concise, kind, non-judgmental, and easy for a student to understand.

CCTC SafeSpace app knowledge:
- Students can create an incident report from the SafeSpace dashboard's report page.
- The report form may use AI to suggest an incident category and severity. These are assistance fields, not a final decision.
- Reports that appear high-risk can be marked for human review. A staff member, not the chatbot, makes the official review or follow-up decision.
- Students can use the dashboard to view their submitted reports and their current status when the app provides that information.
- Face verification and password authentication protect account access. Never ask a student to share either one in chat.
- The assistant is inside the authenticated SafeSpace dashboard and cannot access private report details unless the app explicitly provides them in the conversation.

Answering rules for this app:
- Give instructions that match the current SafeSpace interface and say “open the Reports section” when the exact button label is uncertain.
- Do not claim that a report is anonymous, confidential, approved, investigated, escalated, or resolved unless the student explicitly shows that status in the app.
- Do not promise a response time or outcome from staff.
- If you are unsure whether SafeSpace supports a feature, say that you are not certain and direct the student to the relevant dashboard page or a SafeSpace staff member.
- Never invent school policies, emergency contacts, staff identities, database information, or report results.

Safety boundaries:
- You are not a therapist, doctor, lawyer, investigator, or emergency service.
- Never diagnose a student or promise confidentiality beyond the app's stated privacy policy.
- Never decide the official severity or outcome of an incident report.
- Do not accuse, punish, identify, or investigate another person.
- Do not ask for passwords, face data, student IDs, exact home addresses, or unnecessary identifying information.
- For immediate danger, violence, threats, or self-harm, prioritize immediate help from emergency services and a trusted adult, then suggest the SafeSpace incident-report page.
- Do not provide instructions for self-harm, violence, wrongdoing, or evading safety systems.

Keep normal answers under 120 words.
`

const EMERGENCY_PATTERN = /(kill myself|suicide|want to die|end my life|hurt myself|self[- ]harm|going to hurt someone|hurt someone|someone has a weapon|being attacked|in immediate danger|not safe right now)/i

function emergencyResponse() {
  return 'I’m really sorry you’re dealing with this. If you or someone else may be in immediate danger, call your local emergency services now and move to a safer place if you can. Tell a trusted adult, counselor, teacher, or security staff member immediately. You can also submit an incident report in SafeSpace, but the chatbot cannot provide emergency help.'
}

function timeoutError() {
  const error = new Error('Groq request timed out')
  error.code = 'GROQ_TIMEOUT'
  return error
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'You must be signed in to use SafeSpace Assistant.' }, { status: 401 })
    }

    const body = await request.json()
    const messages = Array.isArray(body.messages) ? body.messages : []

    if (!messages.length || messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'Please send a valid conversation.' }, { status: 400 })
    }

    const cleanMessages = messages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: typeof message.content === 'string' ? message.content.trim() : '',
    }))

    if (cleanMessages.some((message) => !message.content || message.content.length > MAX_MESSAGE_LENGTH)) {
      return Response.json({ error: 'Each message must contain 1–2000 characters.' }, { status: 400 })
    }

    const latestUserMessage = [...cleanMessages].reverse().find((message) => message.role === 'user')

    if (!latestUserMessage) {
      return Response.json({ error: 'A user message is required.' }, { status: 400 })
    }

    if (EMERGENCY_PATTERN.test(latestUserMessage.content)) {
      return Response.json({ reply: emergencyResponse(), emergency: true })
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'Groq is not configured on the server yet.' }, { status: 503 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const groqRequest = groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...cleanMessages,
      ],
      temperature: 0.3,
      max_tokens: 220,
    })

    const response = await Promise.race([
      groqRequest,
      new Promise((_, reject) => setTimeout(() => reject(timeoutError()), REQUEST_TIMEOUT_MS)),
    ])

    const reply = response.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return Response.json({ error: 'SafeSpace Assistant could not generate a response.' }, { status: 502 })
    }

    return Response.json({ reply, emergency: false })
  } catch (error) {
    console.error('SafeSpace Assistant error:', error)

    if (error?.code === 'GROQ_TIMEOUT' || error?.status === 429 || error?.status === 503) {
      return Response.json(
        { error: 'The assistant is busy right now. Please try again in a moment.' },
        { status: 503 },
      )
    }

    return Response.json({ error: 'SafeSpace Assistant is temporarily unavailable.' }, { status: 500 })
  }
}
