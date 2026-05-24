(function duckDuckGoMailProviderModule(root, factory) {
  root.MultiPageBackgroundDuckDuckGoMailProvider = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createDuckDuckGoMailProviderModule() {
  const DDG_EMAIL_ADDRESSES_ENDPOINT = 'https://quack.duckduckgo.com/api/email/addresses';

  function createDuckDuckGoMailProvider(deps = {}) {
    const {
      addLog = async () => {},
      fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
      getState = async () => ({}),
      persistRegistrationEmailState = null,
      setEmailState = async () => {},
      throwIfStopped = () => {},
    } = deps;

    async function persistResolvedEmailState(state = null, email, options = {}) {
      if (typeof persistRegistrationEmailState === 'function') {
        await persistRegistrationEmailState(state, email, options);
        return;
      }
      await setEmailState(email, options);
    }

    function getDuckDuckGoMailConfig(state = {}) {
      return {
        apiToken: String(state.duckDuckGoApiToken || '').trim(),
        verificationMode: normalizeDuckDuckGoVerificationMode(state.duckDuckGoVerificationMode),
        forwardingMailbox: normalizeDuckDuckGoForwardingMailbox(state.duckDuckGoForwardingMailbox),
      };
    }

    function normalizeDuckDuckGoVerificationMode(value = '') {
      return String(value || '').trim().toLowerCase() === 'manual'
        ? 'manual'
        : 'auto';
    }

    function normalizeDuckDuckGoForwardingMailbox(value = '') {
      const normalized = String(value || '').trim().toLowerCase();
      if (!normalized) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
    }

    function ensureDuckDuckGoMailConfig(state = {}) {
      const config = getDuckDuckGoMailConfig(state);
      if (!config.apiToken) {
        throw new Error('DuckDuckGo Email Protection API Token 为空，请先在侧边栏填写。');
      }
      return config;
    }

    function extractAddressFromDuckDuckGoResponse(payload) {
      if (!payload || typeof payload !== 'object') {
        return '';
      }
      const candidates = [
        payload.address,
        payload.email,
        payload.data?.address,
        payload.data?.email,
      ];
      for (const candidate of candidates) {
        const normalized = String(candidate || '').trim().toLowerCase();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          return normalized;
        }
        if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized)) {
          return `${normalized}@duck.com`;
        }
      }
      return '';
    }

    async function requestDuckDuckGoAddress(config, options = {}) {
      if (!fetchImpl) {
        throw new Error('DuckDuckGo 邮箱生成当前运行环境不支持 fetch。');
      }
      const { timeoutMs = 20000 } = options;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
      let response;
      try {
        response = await fetchImpl(DDG_EMAIL_ADDRESSES_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
      } catch (err) {
        const errorMessage = err?.name === 'AbortError'
          ? `DuckDuckGo 请求超时（>${Math.round(timeoutMs / 1000)} 秒）`
          : `DuckDuckGo 请求失败：${err.message}`;
        throw new Error(errorMessage);
      } finally {
        clearTimeout(timeoutId);
      }

      const text = await response.text();
      let parsed;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        const payloadError = typeof parsed === 'object' && parsed
          ? (parsed.message || parsed.error || parsed.msg)
          : '';
        throw new Error(`DuckDuckGo 请求失败：${payloadError || text || `HTTP ${response.status}`}`);
      }

      const address = extractAddressFromDuckDuckGoResponse(parsed);
      if (!address) {
        throw new Error('DuckDuckGo 未返回可用邮箱地址。');
      }
      return address;
    }

    async function fetchDuckDuckGoMailAddress(state, options = {}) {
      throwIfStopped();
      const latestState = state || await getState();
      const config = ensureDuckDuckGoMailConfig(latestState);
      const address = await requestDuckDuckGoAddress(config, options);
      await persistResolvedEmailState(latestState, address, {
        source: 'generated:duckduckgo-mail',
        preserveAccountIdentity: Boolean(options?.preserveAccountIdentity),
      });
      await addLog(`DuckDuckGo：已生成 ${address}`, 'ok');
      return address;
    }

    return {
      fetchDuckDuckGoMailAddress,
      getDuckDuckGoMailConfig,
      normalizeDuckDuckGoForwardingMailbox,
      normalizeDuckDuckGoVerificationMode,
    };
  }

  return {
    createDuckDuckGoMailProvider,
  };
});
