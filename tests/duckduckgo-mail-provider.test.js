const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule() {
  const filePath = path.join(__dirname, '..', 'background', 'duckduckgo-mail-provider.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    globalThis: {},
  };
  sandbox.self = sandbox.globalThis;
  vm.runInNewContext(code, sandbox, { filename: 'duckduckgo-mail-provider.js' });
  return sandbox.globalThis.MultiPageBackgroundDuckDuckGoMailProvider;
}

test('DuckDuckGo provider normalizes settings values', () => {
  const moduleFactory = loadModule();
  const provider = moduleFactory.createDuckDuckGoMailProvider({});
  const config = provider.getDuckDuckGoMailConfig({
    duckDuckGoApiToken: '  token-value  ',
    duckDuckGoVerificationMode: 'MANUAL',
    duckDuckGoForwardingMailbox: '  Demo@Example.com  ',
  });

  assert.equal(config.apiToken, 'token-value');
  assert.equal(config.verificationMode, 'manual');
  assert.equal(config.forwardingMailbox, 'demo@example.com');
});

test('DuckDuckGo provider creates email with bearer token and persists state', async () => {
  const moduleFactory = loadModule();
  let persisted = null;
  let authHeader = '';
  const provider = moduleFactory.createDuckDuckGoMailProvider({
    fetchImpl: async (url, options = {}) => {
      assert.equal(url, 'https://quack.duckduckgo.com/api/email/addresses');
      assert.equal(options.method, 'POST');
      authHeader = options.headers?.Authorization || '';
      return {
        ok: true,
        text: async () => JSON.stringify({ address: 'alias@duck.com' }),
      };
    },
    getState: async () => ({ duckDuckGoApiToken: 'secret-token' }),
    setEmailState: async (email, options = {}) => {
      persisted = { email, options };
    },
    addLog: async () => {},
  });

  const email = await provider.fetchDuckDuckGoMailAddress(null, { preserveAccountIdentity: true });
  assert.equal(email, 'alias@duck.com');
  assert.equal(authHeader, 'Bearer secret-token');
  assert.equal(persisted.email, 'alias@duck.com');
  assert.equal(persisted.options.source, 'generated:duckduckgo-mail');
});

test('DuckDuckGo provider appends @duck.com when API returns only local part', async () => {
  const moduleFactory = loadModule();
  const provider = moduleFactory.createDuckDuckGoMailProvider({
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify({ address: 'squirt-owl-worry' }),
    }),
    getState: async () => ({ duckDuckGoApiToken: 'secret' }),
    setEmailState: async () => {},
    addLog: async () => {},
  });

  const email = await provider.fetchDuckDuckGoMailAddress(null);
  assert.equal(email, 'squirt-owl-worry@duck.com');
});
