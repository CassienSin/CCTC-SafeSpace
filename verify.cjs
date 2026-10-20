// Run: node verify.cjs "C:/path/to/cctc-safespace"
// Uses the application's installed tools; never reads .env or connects to Supabase.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const root = __dirname
const repo = path.resolve(process.argv[2])
const requireApp = createRequire(path.join(repo, 'package.json'))
const parser = requireApp('next/dist/compiled/babel/bundle').parser()
const { ESLint } = requireApp('eslint')

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? files(file) : [file]
  })
}

async function main() {
  const sources = files(root).filter((file) => file.endsWith('.js'))
  const eslint = new ESLint({ cwd: repo })
  let warnings = 0
  for (const file of sources) {
    const source = fs.readFileSync(file, 'utf8')
    parser.parse(source, { sourceType: 'module', plugins: ['jsx'] })
    const virtualPath = path.join(repo, path.relative(root, file))
    const [result] = await eslint.lintText(source, { filePath: virtualPath })
    // Existing hook/dependency warnings in copied pages are not a new full-app audit.
    const critical = result.messages.filter((m) => m.fatal || m.ruleId === 'no-undef')
    assert.equal(critical.length, 0, JSON.stringify({ file, critical }))
    warnings += result.messages.length
    for (const match of source.matchAll(/from ['"](@\/[^'"]+)['"]/g)) {
      const relative = match[1].slice(2)
      const exists = [root, repo].some((base) => ['', '.js', '/index.js'].some((ext) => fs.existsSync(path.join(base, relative + ext))))
      assert.ok(exists, `Unresolved app import: ${match[1]} in ${file}`)
    }
  }
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
  const form = read('app/dashboard/reports/new/page.js')
  assert.ok(form.includes('anonymous: false'))
  assert.ok(form.includes('severity: null'))
  assert.ok(form.includes("offense_classification: 'pending'"))
  for (const obsolete of ['setSeverity', 'severityOptions', 'setAnonymous', '/api/ai/classify']) assert.ok(!form.includes(obsolete), obsolete)
  const sql = read('supabase/migrations/20261019_handbook_reports.sql')
  const handbook = read('lib/reports/handbook.js')
  const categories = [...handbook.matchAll(/\['([a-z_]+)',/g)].map((m) => m[1])
  assert.equal(categories.length, new Set(categories).size)
  for (const category of [...categories, 'harassment', 'threat', 'violence', 'discrimination']) assert.ok(sql.includes(`'${category}'`), category)
  assert.ok(sql.includes('AS RESTRICTIVE FOR INSERT TO authenticated'))
  assert.ok(sql.includes('NEW.anonymous IS DISTINCT FROM OLD.anonymous'))
  assert.ok(sql.includes("p.role = 'admin'"))
  assert.ok(!/UPDATE\s+public\.reports\s+SET/i.test(sql), 'Must not rewrite historical reports')
  const list = read('app/dashboard/reports/page.js')
  const details = read('app/dashboard/reports/[id]/page.js')
  assert.ok(list.includes('!report.anonymous'))
  assert.ok(details.includes('Historical anonymous report'))
  for (const page of [list, details, read('app/dashboard/page.js')]) {
    assert.ok(!page.includes('ai_severity'))
    assert.ok(!page.includes('SeverityBadge'))
  }
  console.log(`PASS: ${sources.length} files parse; no undefined-variable errors; app imports resolve.`)
  console.log(`PASS: ${categories.length} category codes match SQL; submission and historical-anonymity regression checks pass.`)
  console.log(`Other lint messages (existing style/hooks included): ${warnings}. This is not a full Next.js build or a live database test.`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
