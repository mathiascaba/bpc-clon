const REPO = 'mathiascaba/bpc-clon'
const PATH = 'data/codes.json'
const BRANCH = 'main'

async function getCodes(token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-activate' }
  })
  if (res.status === 404) return { codes: {}, sha: null }
  const data = await res.json()
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString())
  return { codes: content, sha: data.sha }
}

async function saveCodes(codes, sha, token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}`
  const body = {
    message: 'activate code',
    content: Buffer.from(JSON.stringify(codes, null, 2)).toString('base64'),
    branch: BRANCH
  }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-activate', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.ok
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  const token = process.env.GH_TOKEN
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'GH_TOKEN not set' }) }

  try {
    const { code, deviceId } = JSON.parse(event.body)
    if (!code || !deviceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code or device' }) }
    }

    const { codes, sha } = await getCodes(token)
    const normalizedCode = code.toUpperCase()
    const entry = codes[normalizedCode]

    if (!entry) {
      if (!codes._attempts) codes._attempts = []
      codes._attempts.push({ code: normalizedCode, deviceId, reason: 'Invalid code', time: new Date().toISOString() })
      await saveCodes(codes, sha, token)
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid code' }) }
    }
    if (entry.used) {
      if (!codes._attempts) codes._attempts = []
      codes._attempts.push({ code: normalizedCode, deviceId, reason: 'Code already used', time: new Date().toISOString() })
      await saveCodes(codes, sha, token)
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Code already used' }) }
    }

    entry.used = true
    entry.deviceId = deviceId
    entry.activatedAt = new Date().toISOString()

    const ok = await saveCodes(codes, sha, token)
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'save failed' }) }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}
