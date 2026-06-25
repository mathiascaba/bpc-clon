import { getStore } from '@netlify/blobs'

export const handler = async (event) => {
  try {
    const store = getStore('bcp-activaciones')
    await store.setJSON('test:hello', { msg: 'world' })
    const val = await store.get('test:hello', { type: 'json' })
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, value: val })
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message, stack: e.stack, name: e.name })
    }
  }
}
