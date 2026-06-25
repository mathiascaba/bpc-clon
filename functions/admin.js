import crypto from 'crypto'

const REPO = 'mathiascaba/bpc-clon'
const PATH = 'data/codes.json'
const BRANCH = 'main'

async function getCodes(token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-admin' }
  })
  if (res.status === 404) return { codes: {}, sha: null }
  const data = await res.json()
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString())
  return { codes: content, sha: data.sha }
}

async function saveCodes(codes, sha, token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}`
  const body = {
    message: 'update codes',
    content: Buffer.from(JSON.stringify(codes, null, 2)).toString('base64'),
    branch: BRANCH
  }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.ok
}

const ADMIN_PASSWORD = 'PEPHJ94H'

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const auth = event.headers.authorization
  if (auth !== ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'wrong password' }) }
  }

  const token = process.env.GH_TOKEN
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'GH_TOKEN not set' }) }

  try {
    if (event.httpMethod === 'GET') {
      const { codes } = await getCodes(token)
      const attempts = codes._attempts || []
      delete codes._attempts
      const list = Object.entries(codes).map(([key, val]) => ({ key, ...val }))
      return { statusCode: 200, headers, body: JSON.stringify({ codes: list, attempts }) }
    }

    if (event.httpMethod === 'POST') {
      const { action, count } = JSON.parse(event.body)

      if (action === 'generate') {
        const num = count || 1
        const { codes, sha } = await getCodes(token)
        const generated = []
        for (let i = 0; i < num; i++) {
          const code = 'BCP-' + crypto.randomBytes(4).toString('hex').toUpperCase()
          codes[code] = { used: false, deviceId: null, activatedAt: null }
          generated.push(code)
        }
        const ok = await saveCodes(codes, sha, token)
        if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'save failed' }) }
        return { statusCode: 200, headers, body: JSON.stringify({ codes: generated }) }
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}
