# Production smoke tests

The deployed URL is pending. Run against the exact assigned HTTPS staging origin using the official QoreX extension and two controlled Diana accounts.

- [ ] Confirm HTTPS, document CSP and security headers, and direct reload of home, Explore, sign-in, dashboard and a real recovery route. Review mobile and desktop in light and dark mode.
- [ ] Confirm private APIs reject guests and enforce Host, Origin and CSRF. Inspect Secure and HttpOnly cookies after real verification. Confirm reconnect preserves a valid session and different wallets remain isolated.
- [ ] Verify public marketplace reads and bounded input. Confirm production omits developer proof routes, mocks, source maps and private file paths.
- [ ] Verify authenticated uploads and downloads, rejection of oversized requests, cross-account denial and expired signed links. Rehearse backup and restore of the database and ciphertext.
- [ ] Exercise rate limits from independent clients and across function instances. Check timeouts, raw bodies and database connections.
- [ ] Complete actual registration, QR scan, finder report, private claim coordination and confirmed recovery. Record independent Diana receipt evidence.

Record timestamp, deployment ID, source revision, observed result, browser and wallet extension version. Keep screenshots free of session credentials and private evidence.
