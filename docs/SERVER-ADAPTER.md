# Optional Server Adapter (disabled by default)

Server-only techniques (`srv-*`) report `server-only` in the static build. A deployer may add an adapter that reports what a server observed, such as request headers, the TLS JA4 fingerprint, HTTP/2 settings or IP metadata. When an enabled adapter returns an observation for a `srv-*` test id, that test shows it as `measured`.

## Interface (`js/adapters/server-adapter.js`)

```js
{
  id: 'my-adapter',
  enabled: false,                       // must be switched on deliberately
  disclosure: {
    endpoint: 'https://lab.example.org/observe',
    observes: ['HTTP request headers', 'JA4 fingerprint'],
    stores: ['nothing'],                // or an exact list
    retention: 'not stored; response computed per request',
    logging: 'access logs disabled for this endpoint',
  },
  async observe() { return { 'srv-http-headers': { /* … */ }, 'srv-tls': { ja4: '…' } }; },
}
```

`validateAdapter()` rejects adapters without a complete disclosure.

## Requirements for any real adapter

1. **Disabled by default.** It must be enabled by the deployer *and* consented to by each visitor, after the disclosure is shown and before any request is sent.
2. **Minimize data.** Return only the fields used by the corresponding `srv-*` tests. Do not set cookies. Do not log IPs or fingerprints.
3. **Define retention:** ideally none (stateless echo). If anything is stored, document what, for how long and why.
4. **Same origin**, or update the CSP `connect-src` explicitly and document it in `docs/PRIVACY.md` and on the Methodology page.
5. **Document** every observed field and its limitations in the test definition.
