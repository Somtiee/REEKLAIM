export default async function dispatch(request, response) {
  try {
    const { default: handleApi } = await import('../.vercel-runtime/api.mjs');
    await handleApi(request, response);
  } catch (error) {
    const known = typeof error?.message === 'string' && /^(Invalid server authentication configuration\.|Vercel requires production settings)/.test(error.message);
    const code = typeof error?.code === 'string' && /^[A-Z0-9_]{1,50}$/.test(error.code) ? error.code : '';
    console.error('ReeKlaim API startup or request failed.', known ? error.message : 'Unexpected error', code);
    if (response.headersSent) { response.end(); return; }
    response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ code: 'API_UNAVAILABLE', error: 'Secure services are temporarily unavailable.' }));
  }
}
