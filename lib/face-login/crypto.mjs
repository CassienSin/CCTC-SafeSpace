import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'
function key() {
  const raw = process.env.FACE_LOGIN_ENCRYPTION_KEY
  if (!/^[a-f0-9]{64}$/i.test(raw || '')) throw new Error('Missing face-login encryption key')
  return Buffer.from(raw, 'hex')
}
export function digest(value) {
  return createHmac('sha256', key()).update(value).digest('hex')
}
export function seal(value, context) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(context))
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map(n => n.toString('base64url')).join('.')
}
export function unseal(value, context) {
  const parts = value.split('.')
  if (parts.length !== 3) throw new Error('Invalid encrypted record')
  const [iv, tag, ciphertext] = parts.map(n => Buffer.from(n,'base64url'))
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(tag)
  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'))
}
