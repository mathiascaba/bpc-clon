exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NETLIFY_BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT,
      NETLIFY_FUNCTIONS_TOKEN: process.env.NETLIFY_FUNCTIONS_TOKEN ? 'present' : 'missing',
      NETLIFY_PURGE_API_TOKEN: process.env.NETLIFY_PURGE_API_TOKEN ? 'present' : 'missing'
    })
  }
}
