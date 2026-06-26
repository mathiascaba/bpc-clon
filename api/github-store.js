const GH_TOKEN = process.env.GH_TOKEN
const FILE = 'data/activacion.json'
const BRANCH = 'main'

const BASE = (repo) => `https://api.github.com/repos/${repo}/contents/${FILE}?ref=${BRANCH}`

async function leer(repo) {
  const res = await fetch(BASE(repo), {
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'sistema' }
  })
  if (res.status === 404) return { codes: {}, dispositivos: [], intentos_fallidos: [] }
  const json = await res.json()
  const parsed = JSON.parse(Buffer.from(json.content, 'base64').toString())
  return { codes: parsed.codes || {}, dispositivos: parsed.dispositivos || [], intentos_fallidos: parsed.intentos_fallidos || [], sha: json.sha }
}

async function guardar(repo, data) {
  const { sha, codes, dispositivos, intentos_fallidos } = data
  const content = { codes, dispositivos, intentos_fallidos }
  const url = `https://api.github.com/repos/${repo}/contents/${FILE}`
  const body = {
    message: 'update activacion',
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha,
    branch: BRANCH
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'sistema', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.ok
}

module.exports = { leer, guardar }
