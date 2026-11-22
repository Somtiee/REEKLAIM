import { z } from 'zod';

// Configure Zod before defining client schemas. The strict CSP disallows its eval probe.
z.config({ jitless: true });

export { z };
