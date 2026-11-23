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
    const status = known ? 'API_CONFIGURATION' : ({
      ERR_MODULE_NOT_FOUND: 'API_MODULE_MISSING',
      MODULE_NOT_FOUND: 'API_MODULE_MISSING',
      ERR_REQUIRE_ESM: 'API_MODULE_FORMAT',
      ERR_DLOPEN_FAILED: 'API_NATIVE_MODULE',
    })[code] ?? 'API_UNAVAILABLE';
    const settings = known && error.message.includes(' Check: ')
      ? error.message.split(' Check: ')[1].match(/\b[A-Z][A-Z0-9_]+\b/g) ?? []
      : [];
    response.end(JSON.stringify({ code: status, error: 'Secure services are temporarily unavailable.', ...(settings.length ? { settings } : {}) }));
  }
}
