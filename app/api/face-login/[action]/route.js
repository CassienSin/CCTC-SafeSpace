import { handle } from '@/lib/face-login/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request, context) {
  const { action } = await context.params
  return handle(request, action)
}

export async function POST(request, context) {
  const { action } = await context.params
  return handle(request, action)
}