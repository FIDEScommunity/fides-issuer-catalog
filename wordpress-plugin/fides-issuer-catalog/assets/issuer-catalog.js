/**
 * FIDES Issuer Catalog - WordPress Plugin JavaScript
 */

(function () {
  'use strict';

  const icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>',
    chevronUp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    externalLinkSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    server: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  const ENVIRONMENT_LABELS = {
    production: 'Production',
    pilot: 'Pilot',
    test: 'Test',
    sandbox: 'Sandbox',
  };

  const VC_FORMAT_LABELS = {
    'sd_jwt_vc': 'SD-JWT VC',
    'vcdm_1_1':  'JWT-VC',
    'vcdm_2_0':  'JSON-LD VC',
    'mdoc':      'mDL/mDoc',
  };

  const ISSUER_FILTER_TO_VOCAB = {
    environment:      'availability',
    organization:     'provider',
    vcFormat:         'credentialFormat',
    credential:       'credential',
    signingAlgorithm: 'signingAlgorithm',
  };

  const config = window.fidesIssuerCatalog || {
    pluginUrl: '',
    githubDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json',
    credentialCatalogUrl: 'https://fides.community/community-tools/credential-catalog/',
    rpCatalogDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/wordpress-plugin/fides-rp-catalog/data/aggregated.json',
    rpCatalogFallbackUrl: '',
    rpCatalogUrl: 'https://fides.community/community-tools/relying-party-catalog/',
    walletCatalogUrl: 'https://fides.community/community-tools/personal-wallets/',
  };

  let issuers = [];
  let filterFacets = null;
  let sortBy = 'lastUpdated';
  let selectedIssuer = null;
  let vocabulary = null;
  let root;
  let rpCatalogData = null;
  let rpCatalogFetchPromise = null;

  const filterGroupState = {
    environment: true,
    organization: true,
    vcFormat: true,
    credential: false,
    signingAlgorithm: false,
  };

  let filters = {
    search: '',
    environment: [],
    organization: [],
    vcFormat: [],
    credential: [],
    signingAlgorithm: [],
    addedLast30Days: false,
    inCredentialCatalog: false,
    ids: []
  };

  // IDs from ?issuers= URL param; preserved so the filter can be toggled back on
  let originalIssuerIds = [];

  let settings;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US');
  }

  function isWithinLastDays(dateStr, days) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
  }

  function uniqueValues(arr, fn) {
    const set = new Set();
    arr.forEach((item) => {
      const v = fn(item);
      if (Array.isArray(v)) v.forEach((x) => x && set.add(x));
      else if (v) set.add(v);
    });
    return [...set].sort();
  }

  function getActiveFilterCount() {
    return (
      filters.environment.length +
      filters.organization.length +
      filters.vcFormat.length +
      filters.credential.length +
      filters.signingAlgorithm.length +
      filters.ids.length +
      (filters.addedLast30Days ? 1 : 0) +
      (filters.inCredentialCatalog ? 1 : 0)
    );
  }

  function computeMetrics() {
    const filtered = getFilteredIssuers();
    return {
      total: issuers.length,
      production: issuers.filter((i) => i.environment === 'production').length,
      organizations: new Set(issuers.map((i) => i.organization?.name)).size,
      addedLast30: issuers.filter((i) => isWithinLastDays(i.firstSeenAt, 30)).length,
    };
  }

  function computeFilterFacets(items) {
    const facets = {
      environment: {},
      organization: {},
      vcFormat: {},
      credential: {},
      signingAlgorithm: {},
      addedLast30Days: 0,
      inCredentialCatalog: 0,
    };
    items.forEach((issuer) => {
      if (issuer.environment) facets.environment[issuer.environment] = (facets.environment[issuer.environment] || 0) + 1;
      if (issuer.organization?.name) facets.organization[issuer.organization.name] = (facets.organization[issuer.organization.name] || 0) + 1;
      (issuer.credentialConfigurations || []).forEach((cc) => {
        if (cc.vcFormat) facets.vcFormat[cc.vcFormat] = (facets.vcFormat[cc.vcFormat] || 0) + 1;
        if (cc.credentialCatalogRef?.displayName) facets.credential[cc.credentialCatalogRef.displayName] = (facets.credential[cc.credentialCatalogRef.displayName] || 0) + 1;
        (cc.signingAlgorithms || []).forEach((alg) => { facets.signingAlgorithm[alg] = (facets.signingAlgorithm[alg] || 0) + 1; });
      });
      if (isWithinLastDays(issuer.firstSeenAt, 30)) facets.addedLast30Days++;
      if ((issuer.credentialConfigurations || []).some((cc) => cc.credentialCatalogRef)) facets.inCredentialCatalog++;
    });
    return facets;
  }

  function getFilteredIssuers() {
    return issuers.filter((issuer) => {
      // ID pre-filter (from ?issuers= URL param)
      if (filters.ids.length > 0 && !filters.ids.includes(issuer.id)) return false;

      if (filters.addedLast30Days && !isWithinLastDays(issuer.firstSeenAt, 30)) return false;
      if (filters.inCredentialCatalog && !(issuer.credentialConfigurations || []).some((cc) => cc.credentialCatalogRef)) return false;
      if (filters.environment.length && !filters.environment.includes(issuer.environment)) return false;
      if (filters.organization.length && !filters.organization.includes(issuer.organization?.name)) return false;

      const configs = issuer.credentialConfigurations || [];
      if (filters.vcFormat.length && !configs.some((cc) => filters.vcFormat.includes(cc.vcFormat))) return false;
      if (filters.credential.length && !configs.some((cc) => filters.credential.includes(cc.credentialCatalogRef?.displayName))) return false;
      if (filters.signingAlgorithm.length && !configs.some((cc) => (cc.signingAlgorithms || []).some((alg) => filters.signingAlgorithm.includes(alg)))) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inName = (issuer.displayName || '').toLowerCase().includes(q);
        const inOrg = (issuer.organization?.name || '').toLowerCase().includes(q);
        const inUrl = (issuer.credentialIssuerUrl || '').toLowerCase().includes(q);
        const inCredentials = configs.some((cc) =>
          (cc.displayName || '').toLowerCase().includes(q) ||
          (cc.credentialCatalogRef?.displayName || '').toLowerCase().includes(q)
        );
        if (!inName && !inOrg && !inUrl && !inCredentials) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'az') return (a.displayName || '').localeCompare(b.displayName || '');
      const dateA = new Date(a.updatedAt || a.fetchedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.fetchedAt || 0).getTime();
      return dateB - dateA;
    });
  }

  function renderEnvironmentBadge(env) {
    const label = ENVIRONMENT_LABELS[env] || env;
    return `<span class="fides-env-badge fides-env-${escapeHtml(env)}">${escapeHtml(label)}</span>`;
  }

  function renderIssuerCard(issuer) {
    const configs = issuer.credentialConfigurations || [];
    const catalogCreds = configs.filter((c) => c.credentialCatalogRef);
    const activityDate = issuer.updatedAt || issuer.firstSeenAt;
    const activityLabel = activityDate
      ? `${issuer.updatedAt ? 'Updated' : 'Added'} ${formatDate(activityDate)}`
      : '';
    const logo = issuer.logoUri || issuer.organization?.logoUri;
    const catalogCount = catalogCreds.length;
    const totalCount = configs.length;
    const extraCount = totalCount - catalogCount;
    const credLabel = catalogCount === 1 ? 'Credential' : 'Credentials';

    return `
      <div class="fides-issuer-card" data-id="${escapeHtml(issuer.id)}" tabindex="0" role="button" aria-label="${escapeHtml(issuer.organization?.name || '')} – ${escapeHtml(issuer.displayName)}">
        <header class="fides-credential-header">
          <div class="fides-credential-subject-icon" aria-hidden="true">
            ${logo
              ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(issuer.organization?.name || '')}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;">`
              : icons.server
            }
          </div>
          <div class="fides-credential-header-text">
            <h3 class="fides-credential-name" title="${escapeHtml(issuer.organization?.name || '')}">${escapeHtml(issuer.organization?.name || issuer.id)}</h3>
            <p class="fides-credential-provider">${escapeHtml(issuer.displayName || '')}</p>
          </div>
        </header>
        <div class="fides-wallet-body">
          ${activityLabel ? `<p class="fides-wallet-updated">${escapeHtml(activityLabel)}</p>` : ''}
          <div class="fides-card-counts">
            <div class="fides-card-count-item">
              <span class="fides-card-count-num">${catalogCount}</span>
              <span class="fides-card-count-label">${escapeHtml(credLabel)}</span>
              ${extraCount > 0 ? `<span class="fides-card-count-extra">+ ${extraCount} more</span>` : ''}
            </div>
            <div class="fides-card-count-item fides-card-count-item--rp" data-issuer-id="${escapeHtml(issuer.id)}">
              <span class="fides-card-count-num fides-card-rp-count">—</span>
              <span class="fides-card-count-label">Relying Parties</span>
            </div>
          </div>
        </div>
        <div class="fides-wallet-footer">
          <div class="fides-wallet-links"></div>
          <span class="fides-view-details">${icons.eye} View details</span>
        </div>
      </div>
    `;
  }

  async function fetchRpCatalog() {
    if (rpCatalogData) return rpCatalogData;
    if (rpCatalogFetchPromise) return rpCatalogFetchPromise;
    rpCatalogFetchPromise = (async () => {
      const sources = [
        config.rpCatalogDataUrl,
        config.rpCatalogFallbackUrl,
      ].filter(Boolean);
      for (const url of sources) {
        try {
          const r = await fetch(url);
          if (r.ok) {
            const data = await r.json();
            rpCatalogData = data.relyingParties || [];
            return rpCatalogData;
          }
        } catch (_) {}
      }
      rpCatalogData = [];
      return [];
    })();
    return rpCatalogFetchPromise;
  }

  function countRpsForIssuer(issuer, rpList) {
    const credIds = new Set(
      (issuer.credentialConfigurations || [])
        .map((c) => c.credentialCatalogRef?.id)
        .filter(Boolean)
    );
    if (!credIds.size) return null;
    return rpList.filter((rp) =>
      (rp.acceptedCredentialRefs || []).some((ref) => credIds.has(ref.credentialCatalogId))
    ).length;
  }

  function renderModal() {
    if (!selectedIssuer) return '';
    const issuer = selectedIssuer;
    const logo = issuer.logoUri || issuer.organization?.logoUri;
    const configs = issuer.credentialConfigurations || [];
    const credentialsWithRef = configs.filter((c) => c.credentialCatalogRef);
    const theme = root?.dataset?.theme || 'fides';

    const allFormats = [...new Set(configs.map((c) => c.vcFormat).filter(Boolean))];
    const allAlgorithms = [...new Set(configs.flatMap((c) => c.signingAlgorithms || []))];
    const allProofTypes = [...new Set(configs.flatMap((c) => c.proofTypes || []))];
    const catalogCount = credentialsWithRef.length;
    const showCatalogToggle = catalogCount > 0 && catalogCount < configs.length;
    const catalogConfigs = configs.filter((cc) => cc.credentialCatalogRef);
    const uncataloguedConfigs = configs.filter((cc) => !cc.credentialCatalogRef);

    return `
      <div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="${escapeHtml(theme)}">
        <div class="fides-modal" role="dialog" aria-modal="true" aria-labelledby="fides-modal-title">
          <div class="fides-modal-header">
            <div class="fides-modal-header-content">
              ${logo
                ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(issuer.organization?.name || '')}" class="fides-modal-logo">`
                : `<div class="fides-modal-logo-placeholder">${icons.server}</div>`
              }
              <div class="fides-modal-title-wrap">
                <h2 class="fides-modal-title" id="fides-modal-title">${escapeHtml(issuer.organization?.name || issuer.id)}</h2>
                <p class="fides-modal-provider">${escapeHtml(issuer.displayName || '')}</p>
              </div>
            </div>
            <div class="fides-modal-header-actions">
              <button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link" title="Copy link">
                ${icons.share}
              </button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">
                ${icons.xLarge}
              </button>
            </div>
          </div>

          <div class="fides-modal-body">
            <!-- Description (if available) -->
            ${issuer.description ? `<div class="fides-modal-intro"><p class="fides-modal-description">${escapeHtml(issuer.description)}</p></div>` : ''}

            <!-- FIDES Ecosystem Model -->
            <div class="fides-accordion fides-modal-section">
              <div class="fides-accordion-header fides-modal-section-header" style="pointer-events:none;cursor:default;">
                <span class="fides-accordion-title">${icons.wallet} FIDES Ecosystem Model</span>
              </div>
              <div class="fides-accordion-body fides-modal-ecosystem-body">
                <div class="fides-modal-ecosystem">
                  <!-- Personal Wallets (top) -->
                  <div class="fides-eco-wallet-row">
                    <div class="fides-eco-wallet-box">
                      <span class="fides-eco-wallet-count">—</span>
                      <span class="fides-eco-wallet-label">Personal Wallets</span>
                    </div>
                  </div>
                  <div class="fides-eco-wallet-connector">${icons.chevronUp}</div>
                  <!-- Main row: Issuer → Credentials → Relying Parties -->
                  <div class="fides-eco-main-row">
                    <div class="fides-eco-col fides-eco-col-center">
                      <div class="fides-eco-center-card">
                        <div class="fides-eco-center-icon">
                          ${logo
                            ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(issuer.organization?.name || '')}" style="width:24px;height:24px;object-fit:contain;border-radius:4px;">`
                            : icons.server
                          }
                        </div>
                        <p class="fides-eco-center-name">${escapeHtml(issuer.displayName)}</p>
                        ${issuer.organization?.name ? `<p class="fides-eco-center-authority">${escapeHtml(issuer.organization.name)}</p>` : ''}
                      </div>
                    </div>
                    <div class="fides-eco-arrow">${icons.chevronDown}</div>
                    <div class="fides-eco-col fides-eco-col-side fides-eco-col-side--green"
                      ${credentialsWithRef.length > 0 && config.credentialCatalogUrl ? `data-href="${config.credentialCatalogUrl.replace(/\/$/, '')}?credentials=${credentialsWithRef.map(cc => encodeURIComponent(cc.credentialCatalogRef.id)).join(',')}"` : ''}>
                      <div class="fides-eco-col-header">
                        <span class="fides-eco-count">${credentialsWithRef.length}</span>
                        <span class="fides-eco-label">Credential types</span>
                      </div>
                      <div class="fides-eco-entities">
                        ${credentialsWithRef.length === 0
                          ? `<p class="fides-modal-empty">No catalog credentials.</p>`
                          : (() => {
                              const visible = credentialsWithRef.slice(0, 2);
                              const hidden = credentialsWithRef.length - 2;
                              const renderCredTag = (cc) => {
                                const ref = cc.credentialCatalogRef;
                                const href = config.credentialCatalogUrl
                                  ? `${config.credentialCatalogUrl.replace(/\/$/, '')}?credential=${encodeURIComponent(ref.id)}`
                                  : null;
                                const inner = `${escapeHtml(ref.displayName || ref.id)}${href ? ' ' + icons.externalLinkSmall : ''}`;
                                return href
                                  ? `<a href="${escapeHtml(href)}" class="fides-eco-tag fides-eco-tag-green" onclick="event.stopPropagation();">${escapeHtml(ref.displayName || ref.id)}</a>`
                                  : `<span class="fides-eco-tag fides-eco-tag-green">${inner}</span>`;
                              };
                              if (hidden > 0) {
                                return visible.slice(0, -1).map(renderCredTag).join('') +
                                  `<div class="fides-eco-tag-last-row">${renderCredTag(visible[visible.length - 1])}<span class="fides-eco-more fides-eco-more--green">+ ${hidden} more</span></div>`;
                              }
                              return visible.map(renderCredTag).join('');
                            })()
                        }
                      </div>
                    </div>
                    <div class="fides-eco-arrow">${icons.chevronDown}</div>
                    <div class="fides-eco-col fides-eco-col-side fides-eco-col-side--blue">
                      <div class="fides-eco-col-header">
                        <span class="fides-eco-count fides-eco-rp-count">—</span>
                        <span class="fides-eco-label">Relying Parties</span>
                      </div>
                      <div class="fides-eco-entities fides-eco-entities--row fides-eco-rp-entities"></div>
                    </div>
                  </div>
                  <div class="fides-eco-wallet-connector">${icons.chevronUp}</div>
                  <!-- Business Wallets (bottom) -->
                  <div class="fides-eco-wallet-row">
                    <div class="fides-eco-wallet-box">
                      <span class="fides-eco-wallet-count">—</span>
                      <span class="fides-eco-wallet-label">Business Wallets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Credential configurations accordion -->
            ${configs.length > 0 ? `
              <div class="fides-accordion is-open" id="fides-accordion-configs">
                <button class="fides-accordion-header" type="button" aria-expanded="true">
                  <span class="fides-accordion-title">${icons.shield} Credential types issued${configs.length > 0 ? ` <span class="fides-accordion-count">${configs.length}</span>` : ''}</span>
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
                <div class="fides-accordion-body">
                  <div class="fides-attributes-table-wrap">
                    <table class="fides-attributes-table">
                      <thead>
                        <tr>
                          <th>Credential</th>
                          <th>Format</th>
                          <th>Credential catalog</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${catalogConfigs.map((cc) => `
                          <tr>
                            <td>${escapeHtml(cc.displayName || cc.configurationId)}</td>
                            <td><span class="fides-tag credential-format">${escapeHtml(VC_FORMAT_LABELS[cc.vcFormat] || cc.vcFormat)}</span></td>
                            <td><a href="${escapeHtml((config.credentialCatalogUrl || '').replace(/\/$/, '') + '?credential=' + encodeURIComponent(cc.credentialCatalogRef.id))}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${escapeHtml(cc.credentialCatalogRef.displayName || cc.credentialCatalogRef.id)}</a></td>
                          </tr>
                        `).join('')}
                        ${catalogConfigs.length === 0 ? `<tr><td colspan="3" style="color:var(--fides-text-muted);font-style:italic;">No credentials in catalog.</td></tr>` : ''}
                      </tbody>
                      ${uncataloguedConfigs.length > 0 ? `
                        <tbody class="fides-configs-extra" style="display:none;" id="fides-configs-extra">
                          ${uncataloguedConfigs.map((cc) => `
                            <tr>
                              <td>${escapeHtml(cc.displayName || cc.configurationId)}</td>
                              <td><span class="fides-tag credential-format">${escapeHtml(VC_FORMAT_LABELS[cc.vcFormat] || cc.vcFormat)}</span></td>
                              <td><span style="color:var(--fides-text-muted);">—</span></td>
                            </tr>
                          `).join('')}
                        </tbody>
                        <tbody>
                          <tr class="fides-configs-show-more-row">
                            <td colspan="3">
                              <button type="button" class="fides-show-more-btn" id="fides-configs-show-more">
                                Show ${uncataloguedConfigs.length} more
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      ` : ''}
                    </table>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Other details accordion (open by default) -->
            <div class="fides-accordion is-open" id="fides-accordion-details">
              <button class="fides-accordion-header" type="button" aria-expanded="true">
                <span class="fides-accordion-title">${icons.shield} Other details</span>
                <span class="fides-accordion-chevron">${icons.chevronDown}</span>
              </button>
              <div class="fides-accordion-body">
                <div class="fides-details-kv">
                  <div class="fides-kv-row fides-kv-row-wide">
                    <span class="fides-kv-key">URL</span>
                    <span class="fides-kv-val fides-kv-val--url">
                      ${issuer.oid4vciMetadataUrl
                        ? `<a href="${escapeHtml(issuer.oid4vciMetadataUrl)}" target="_blank" rel="noopener" class="fides-modal-link-inline fides-url-ellipsis" title="${escapeHtml(issuer.oid4vciMetadataUrl)}" onclick="event.stopPropagation();">${escapeHtml(issuer.oid4vciMetadataUrl)} ${icons.externalLinkSmall}</a>`
                        : '—'
                      }
                    </span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Cred. formats</span>
                    <span class="fides-kv-val fides-kv-tags">
                      ${allFormats.length > 0
                        ? allFormats.map((f) => `<span class="fides-tag credential-format">${escapeHtml(VC_FORMAT_LABELS[f] || f)}</span>`).join('')
                        : '—'
                      }
                    </span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Project context</span>
                    <span class="fides-kv-val">${escapeHtml(issuer.projectContext || '—')}</span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Signing algorithms</span>
                    <span class="fides-kv-val fides-kv-tags">
                      ${allAlgorithms.length > 0
                        ? allAlgorithms.map((a) => `<span class="fides-tag">${escapeHtml(a)}</span>`).join('')
                        : '—'
                      }
                    </span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Environment</span>
                    <span class="fides-kv-val">${escapeHtml(ENVIRONMENT_LABELS[issuer.environment] || issuer.environment || '—')}</span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Proof types</span>
                    <span class="fides-kv-val fides-kv-tags">
                      ${allProofTypes.length > 0
                        ? allProofTypes.map((p) => `<span class="fides-tag">${escapeHtml(p)}</span>`).join('')
                        : '—'
                      }
                    </span>
                  </div>
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Last updated</span>
                    <span class="fides-kv-val">${escapeHtml(issuer.updatedAt ? formatDate(issuer.updatedAt) : '—')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organization info -->
            <div class="fides-modal-provider-section">
              <h4 class="fides-modal-section-title">Organization</h4>
              <div class="fides-modal-provider-info">
                <div class="fides-modal-provider-detail">
                  <span class="fides-modal-provider-label">Name:</span>
                  <span class="fides-modal-provider-value">${escapeHtml(issuer.organization?.name || '')}</span>
                </div>
                ${issuer.organization?.website ? `
                  <div class="fides-modal-provider-detail">
                    <span class="fides-modal-provider-label">Website:</span>
                    <a href="${escapeHtml(issuer.organization.website)}" class="fides-modal-provider-value" target="_blank" rel="noopener" style="color:var(--fides-accent);">${escapeHtml(issuer.organization.website)}</a>
                  </div>
                ` : ''}
                ${issuer.organization?.did ? `
                  <div class="fides-modal-provider-detail">
                    <span class="fides-modal-provider-label">DID:</span>
                    <code class="fides-modal-provider-did">${escapeHtml(issuer.organization.did)}</code>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderKpiCards(metrics) {
    return `
      <div class="fides-kpi-row">
        <button class="fides-kpi-card" type="button" data-kpi-action="reset">
          <span class="fides-kpi-value">${metrics.total}</span>
          <span class="fides-kpi-label">Issuers</span>
        </button>
        <button class="fides-kpi-card ${filters.environment.includes('production') ? 'active' : ''}" type="button" data-kpi-action="toggle-production">
          <span class="fides-kpi-value">${metrics.production}</span>
          <span class="fides-kpi-label">Production</span>
        </button>
        <button class="fides-kpi-card" type="button" data-kpi-action="reset">
          <span class="fides-kpi-value">${metrics.organizations}</span>
          <span class="fides-kpi-label">Organizations</span>
        </button>
        <button class="fides-kpi-card ${filters.addedLast30Days ? 'active' : ''}" type="button" data-kpi-action="toggle-added">
          <span class="fides-kpi-value">${metrics.addedLast30}</span>
          <span class="fides-kpi-label">New<span class="fides-kpi-label-extra"> last 30 days</span></span>
        </button>
      </div>
    `;
  }

  function renderCheckboxGroup(title, key, options, facets) {
    if (!options || options.length === 0) return '';
    const selected = filters[key] || [];
    const expanded = filterGroupState[key] !== false;
    const groupClass = expanded ? '' : 'collapsed';
    const hasActiveClass = selected.length > 0 ? 'has-active' : '';
    return `
      <div class="fides-filter-group collapsible ${groupClass} ${hasActiveClass}" data-filter-group="${escapeHtml(key)}">
        <button class="fides-filter-label-toggle" type="button" aria-expanded="${expanded}">
          <span class="fides-filter-label">${escapeHtml(title)}</span>
          <span class="fides-filter-active-indicator"></span>
          ${icons.chevronDown}
        </button>
        <div class="fides-filter-options">
          ${options.map((opt) => `
            <label class="fides-filter-checkbox">
              <input type="checkbox" data-filter-group="${escapeHtml(key)}" value="${escapeHtml(opt)}" ${selected.includes(opt) ? 'checked' : ''}>
              <span>${escapeHtml(ENVIRONMENT_LABELS[opt] || VC_FORMAT_LABELS[opt] || opt)}<span class="fides-filter-option-count">(${facets?.[key]?.[opt] || 0})</span></span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderFiltersPanel() {
    if (!settings.showFilters) return '';
    const activeFilterCount = getActiveFilterCount();

    const environmentOptions = ['production', 'pilot', 'test', 'sandbox'].filter(
      (e) => filterFacets?.environment?.[e] > 0 || filters.environment.includes(e)
    );
    const organizationOptions = uniqueValues(issuers, (i) => i.organization?.name);
    const vcFormatOptions = uniqueValues(issuers, (i) => (i.credentialConfigurations || []).map((c) => c.vcFormat));
    const credentialOptions = uniqueValues(issuers, (i) => (i.credentialConfigurations || []).filter((c) => c.credentialCatalogRef?.displayName).map((c) => c.credentialCatalogRef.displayName));
    const signingAlgOptions = uniqueValues(issuers, (i) => (i.credentialConfigurations || []).flatMap((c) => c.signingAlgorithms || []));

    return `
      <aside class="fides-sidebar">
        <div class="fides-sidebar-header">
          <div class="fides-sidebar-title">
            ${icons.filter}
            <span>Filters</span>
            <span class="fides-filter-count ${activeFilterCount > 0 ? '' : 'hidden'}">${activeFilterCount || 0}</span>
          </div>
          <div class="fides-sidebar-actions">
            <button class="fides-clear-all ${activeFilterCount > 0 ? '' : 'hidden'}" id="fides-clear" type="button">
              ${icons.x} Clear
            </button>
            <button class="fides-sidebar-close" id="fides-sidebar-close" aria-label="Close filters">
              ${icons.xLarge}
            </button>
          </div>
        </div>
        <div class="fides-sidebar-content">
          ${settings.showSearch ? `
            <div class="fides-sidebar-search">
              <div class="fides-search-wrapper">
                <span class="fides-search-icon">${icons.search}</span>
                <input id="fides-search-input" class="fides-search-input" type="text" placeholder="Search..." value="${escapeHtml(filters.search)}">
                <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
              </div>
            </div>
          ` : ''}
          <div class="fides-quick-filters">
            <span class="fides-quick-filters-title">Quick filters</span>
            <label class="fides-filter-checkbox">
              <input type="checkbox" id="fides-added-last-30" ${filters.addedLast30Days ? 'checked' : ''}>
              <span>Added last 30 days<span class="fides-filter-option-count">(${filterFacets?.addedLast30Days || 0})</span></span>
            </label>
            <label class="fides-filter-checkbox">
              <input type="checkbox" id="fides-in-credential-catalog" ${filters.inCredentialCatalog ? 'checked' : ''}>
              <span>In credential catalog<span class="fides-filter-option-count">(${filterFacets?.inCredentialCatalog || 0})</span></span>
            </label>
            ${originalIssuerIds.length > 0 ? `
            <label class="fides-filter-checkbox">
              <input type="checkbox" data-filter="linkedIssuers" ${filters.ids.length > 0 ? 'checked' : ''}>
              <span>Linked issuers (${originalIssuerIds.length})</span>
            </label>` : ''}
          </div>
          ${renderCheckboxGroup('Environment', 'environment', environmentOptions, filterFacets)}
          ${renderCheckboxGroup('Organization', 'organization', organizationOptions, filterFacets)}
          ${renderCheckboxGroup('VC Format', 'vcFormat', vcFormatOptions, filterFacets)}
          ${renderCheckboxGroup('Credential', 'credential', credentialOptions, filterFacets)}
          ${renderCheckboxGroup('Signing Algorithm', 'signingAlgorithm', signingAlgOptions, filterFacets)}
        </div>
      </aside>
    `;
  }

  function render() {
    const filtered = getFilteredIssuers();
    const metrics = computeMetrics();

    root.innerHTML = `
      <div class="fides-issuer-layout">
        <div class="fides-main-layout fides-main ${settings.showFilters ? '' : 'no-filters'}">
          ${renderFiltersPanel()}
          <section class="fides-main-content">
            ${settings.showSearch ? `
              <div class="fides-mobile-search">
                <div class="fides-search-wrapper">
                  <span class="fides-search-icon">${icons.search}</span>
                  <input id="fides-mobile-search-input" class="fides-search-input fides-mobile-search-input" type="text" placeholder="Search..." value="${escapeHtml(filters.search)}">
                  <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-mobile-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
                </div>
              </div>
            ` : ''}
            <div class="fides-results-bar">
              <label class="fides-sort-label" for="fides-sort-select">
                <span class="fides-sort-text">Sort by:</span>
                <select id="fides-sort-select" class="fides-sort-select">
                  <option value="lastUpdated" ${sortBy === 'lastUpdated' ? 'selected' : ''}>Last updated</option>
                  <option value="az" ${sortBy === 'az' ? 'selected' : ''}>A–Z</option>
                </select>
              </label>
              ${settings.showFilters ? `
                <button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">
                  ${icons.filter}
                  <span>Filters</span>
                  <span class="fides-filter-count ${getActiveFilterCount() > 0 ? '' : 'hidden'}">${getActiveFilterCount() || 0}</span>
                </button>
              ` : ''}
            </div>
            ${renderKpiCards(metrics)}
            <div class="fides-results">
              <div class="fides-issuer-grid" data-columns="${escapeHtml(settings.columns)}">
                ${filtered.length > 0
                  ? filtered.map(renderIssuerCard).join('')
                  : '<p class="fides-empty">No issuers found.</p>'
                }
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    bindEvents();
  }

  function showToast(message, type = 'success', theme = 'fides') {
    const existing = document.querySelector('.fides-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `fides-toast fides-toast-${type}`;
    toast.setAttribute('data-theme', theme);
    toast.innerHTML = `
      <span class="fides-toast-icon">${type === 'success' ? icons.check : icons.x}</span>
      <span class="fides-toast-message">${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fides-toast-out 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function copyIssuerLink(e) {
    e.stopPropagation();
    if (!selectedIssuer) return;
    const url = new URL(window.location.href);
    url.searchParams.set('issuer', selectedIssuer.id);
    const theme = root?.dataset?.theme || 'fides';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url.toString()).then(
        () => showToast('Link copied to clipboard', 'success', theme),
        () => fallbackCopy(url.toString(), theme)
      );
    } else {
      fallbackCopy(url.toString(), theme);
    }
  }

  function fallbackCopy(text, theme) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Link copied to clipboard', 'success', theme);
    } catch {
      showToast('Failed to copy link', 'error', theme);
    }
    document.body.removeChild(ta);
  }

  function openModal(id) {
    selectedIssuer = issuers.find((i) => i.id === id) || null;
    if (!selectedIssuer) return;
    const existing = document.getElementById('fides-modal-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', renderModal());
    document.body.style.overflow = 'hidden';
    bindModalEvents();
    const params = new URLSearchParams(window.location.search);
    params.set('issuer', id);
    history.replaceState(null, '', '?' + params.toString());

    // Async: fill in RP count and tags once RP catalog is loaded
    const issuerForRp = selectedIssuer;
    fetchRpCatalog().then((rpList) => {
      const credIds = new Set(
        (issuerForRp.credentialConfigurations || [])
          .map((c) => c.credentialCatalogRef?.id)
          .filter(Boolean)
      );
      const matchingRps = rpList.filter((rp) =>
        (rp.acceptedCredentialRefs || []).some((ref) => credIds.has(ref.credentialCatalogId))
      );
      const count = credIds.size ? matchingRps.length : null;
      const countEl = document.querySelector('.fides-eco-rp-count');
      if (countEl && count !== null) countEl.textContent = count;

      // Make the RP column box clickable to the RP catalog
      if (config.rpCatalogUrl && matchingRps.length > 0) {
        const rpColEl = document.querySelector('.fides-eco-col-side--blue');
        if (rpColEl) {
          const rpIds = matchingRps.map(rp => encodeURIComponent(rp.id)).join(',');
          rpColEl.dataset.href = config.rpCatalogUrl.replace(/\/$/, '') + '/?rps=' + rpIds;
          rpColEl.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            window.location.href = rpColEl.dataset.href;
          });
        }
      }

      const entitiesEl = document.querySelector('.fides-eco-rp-entities');
      if (entitiesEl && matchingRps.length > 0) {
        const shown = matchingRps.slice(0, 2);
        const hidden = matchingRps.length - 2;
        const renderRpTag = (rp) => {
          const label = escapeHtml(rp.name || rp.id);
          return rp.website
            ? `<a href="${escapeHtml(rp.website)}" class="fides-eco-tag fides-eco-tag-blue" onclick="event.stopPropagation();">${label}</a>`
            : `<span class="fides-eco-tag fides-eco-tag-blue">${label}</span>`;
        };
        if (hidden > 0) {
          entitiesEl.innerHTML = shown.slice(0, -1).map(renderRpTag).join('') +
            `<div class="fides-eco-tag-last-row">${renderRpTag(shown[shown.length - 1])}<span class="fides-eco-more fides-eco-more--blue">+ ${hidden} more</span></div>`;
        } else {
          entitiesEl.innerHTML = shown.map(renderRpTag).join('');
        }
      }

      // Collect unique personal wallets from matching RPs
      const walletById = new Map();
      for (const rp of matchingRps) {
        for (const w of (rp.supportedWallets || [])) {
          if (w && w.walletCatalogId && !walletById.has(w.walletCatalogId)) {
            walletById.set(w.walletCatalogId, { id: w.walletCatalogId, name: w.name || w.walletCatalogId });
          }
        }
      }
      const walletItems = Array.from(walletById.values());
      const walletBoxEl = document.querySelector('.fides-eco-wallet-row .fides-eco-wallet-box');
      if (walletBoxEl && walletItems.length > 0 && config.walletCatalogUrl) {
        const walletUrl = config.walletCatalogUrl.replace(/\/$/, '') + '/?wallets=' + walletItems.map(w => encodeURIComponent(w.id)).join(',');
        const link = document.createElement('a');
        link.href = walletUrl;
        link.className = 'fides-eco-wallet-box fides-eco-wallet-box--link';
        link.addEventListener('click', (e) => e.stopPropagation());
        link.innerHTML = `<span class="fides-eco-wallet-count">${walletItems.length}</span><span class="fides-eco-wallet-label">${walletItems.length === 1 ? 'Personal Wallet' : 'Personal Wallets'}</span>`;
        walletBoxEl.replaceWith(link);
      }
    });
  }

  function closeModal() {
    selectedIssuer = null;
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => { overlay.remove(); }, 200);
    }
    document.body.style.overflow = '';
    const params = new URLSearchParams(window.location.search);
    params.delete('issuer');
    const qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  function bindModalEvents() {
    const closeBtn = document.getElementById('fides-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    }

    const copyBtn = document.getElementById('fides-modal-copy-link');
    if (copyBtn) copyBtn.addEventListener('click', copyIssuerLink);

    const showMoreBtn = document.getElementById('fides-configs-show-more');
    const extraTbody = document.getElementById('fides-configs-extra');
    if (showMoreBtn && extraTbody) {
      const uncatCount = extraTbody.querySelectorAll('tr').length;
      showMoreBtn.addEventListener('click', () => {
        const isHidden = extraTbody.style.display === 'none';
        extraTbody.style.display = isHidden ? 'table-row-group' : 'none';
        showMoreBtn.textContent = isHidden ? 'Show less' : `Show ${uncatCount} more`;
      });
    }

    // Accordion toggle
    document.querySelectorAll('.fides-modal-overlay .fides-accordion-header[type="button"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const accordion = btn.closest('.fides-accordion');
        if (!accordion) return;
        const isOpen = accordion.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    // Click handler for ecosystem column boxes with data-href (credential column)
    document.querySelectorAll('.fides-modal-overlay .fides-eco-col-side[data-href]').forEach((col) => {
      col.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.location.href = col.dataset.href;
      });
    });

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    });
  }

  function bindEvents() {
    const syncMobileSearch = (value) => {
      const mobileInput = root.querySelector('#fides-mobile-search-input');
      const mobileClear = root.querySelector('#fides-mobile-search-clear');
      if (mobileInput) mobileInput.value = value;
      if (mobileClear) mobileClear.classList.toggle('hidden', !value);
    };

    const searchInput = root.querySelector('#fides-search-input');
    const searchClear = root.querySelector('#fides-search-clear');
    const handleSearch = debounce((e) => {
      filters.search = e.target.value || '';
      if (searchClear) searchClear.classList.toggle('hidden', !filters.search);
      syncMobileSearch(filters.search);
      renderIssuerGridOnly();
    }, 300);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchClear) searchClear.addEventListener('click', () => {
      filters.search = '';
      if (searchInput) searchInput.value = '';
      searchClear.classList.add('hidden');
      syncMobileSearch('');
      renderIssuerGridOnly();
    });

    const mobileInput = root.querySelector('#fides-mobile-search-input');
    const mobileClear = root.querySelector('#fides-mobile-search-clear');
    const handleMobileSearch = debounce((e) => {
      filters.search = e.target.value || '';
      const si = root.querySelector('#fides-search-input');
      const sc = root.querySelector('#fides-search-clear');
      if (si) si.value = filters.search;
      if (sc) sc.classList.toggle('hidden', !filters.search);
      if (mobileClear) mobileClear.classList.toggle('hidden', !filters.search);
      renderIssuerGridOnly();
    }, 300);
    if (mobileInput) mobileInput.addEventListener('input', handleMobileSearch);
    if (mobileClear) mobileClear.addEventListener('click', () => {
      filters.search = '';
      if (mobileInput) mobileInput.value = '';
      mobileClear.classList.add('hidden');
      const si = root.querySelector('#fides-search-input');
      if (si) si.value = '';
      renderIssuerGridOnly();
    });

    const sortSelect = root.querySelector('#fides-sort-select');
    if (sortSelect) sortSelect.addEventListener('change', (e) => { sortBy = e.target.value; render(); });

    const clearBtn = root.querySelector('#fides-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      filters = { search: '', environment: [], organization: [], vcFormat: [], credential: [], signingAlgorithm: [], addedLast30Days: false, inCredentialCatalog: false, ids: [] };
      originalIssuerIds = [];
      const url = new URL(window.location.href);
      url.searchParams.delete('issuers');
      history.replaceState(null, '', url.toString());
      render();
    });

    root.querySelectorAll('[data-filter-group]').forEach((input) => {
      if (input.tagName !== 'INPUT') return;
      input.addEventListener('change', (e) => {
        const group = e.target.dataset.filterGroup;
        const value = e.target.value;
        if (!filters[group]) filters[group] = [];
        if (e.target.checked) { if (!filters[group].includes(value)) filters[group].push(value); }
        else { filters[group] = filters[group].filter((v) => v !== value); }
        render();
      });
    });

    const addedInput = root.querySelector('#fides-added-last-30');
    if (addedInput) addedInput.addEventListener('change', (e) => { filters.addedLast30Days = e.target.checked; render(); });
    const catalogInput = root.querySelector('#fides-in-credential-catalog');
    if (catalogInput) catalogInput.addEventListener('change', (e) => { filters.inCredentialCatalog = e.target.checked; render(); });

    const linkedIssuersInput = root.querySelector('[data-filter="linkedIssuers"]');
    if (linkedIssuersInput) {
      linkedIssuersInput.addEventListener('change', (e) => {
        filters.ids = e.target.checked ? [...originalIssuerIds] : [];
        render();
      });
    }

    root.querySelectorAll('.fides-kpi-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.kpiAction;
        if (action === 'reset') { filters.environment = []; filters.addedLast30Days = false; filters.inCredentialCatalog = false; sortBy = 'lastUpdated'; }
        else if (action === 'toggle-production') {
          if (filters.environment.includes('production')) filters.environment = filters.environment.filter((e) => e !== 'production');
          else filters.environment = [...filters.environment, 'production'];
        } else if (action === 'toggle-added') {
          filters.addedLast30Days = !filters.addedLast30Days;
        }
        render();
      });
    });

    root.querySelectorAll('.fides-filter-label-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const group = toggle.closest('.fides-filter-group')?.dataset.filterGroup;
        if (group && group in filterGroupState) { filterGroupState[group] = !filterGroupState[group]; render(); }
      });
    });

    // Card clicks
    root.querySelectorAll('.fides-issuer-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });

    // Mobile filter drawer
    const mobileToggle = root.querySelector('#fides-mobile-filter-toggle');
    const sidebar = root.querySelector('.fides-sidebar');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => { sidebar.classList.add('mobile-open'); document.body.style.overflow = 'hidden'; });
    }
    const sidebarClose = root.querySelector('#fides-sidebar-close');
    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); document.body.style.overflow = ''; });
    }
    if (sidebar) {
      sidebar.addEventListener('click', (e) => { if (e.target === sidebar && sidebar.classList.contains('mobile-open')) { sidebar.classList.remove('mobile-open'); document.body.style.overflow = ''; } });
    }

    initVocabularyInfo(root);

    // Fill RP counts on cards asynchronously
    fillCardRpCounts(getFilteredIssuers());
  }

  function renderIssuerGridOnly() {
    const grid = root.querySelector('.fides-issuer-grid');
    if (!grid) return;
    const filtered = getFilteredIssuers();
    grid.innerHTML = filtered.length > 0
      ? filtered.map(renderIssuerCard).join('')
      : '<p class="fides-empty">No issuers found.</p>';
    root.querySelectorAll('.fides-issuer-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });
    fillCardRpCounts(filtered);
  }

  function fillCardRpCounts(issuerList) {
    fetchRpCatalog().then((rpList) => {
      issuerList.forEach((issuer) => {
        const count = countRpsForIssuer(issuer, rpList);
        if (count === null) return;
        root.querySelectorAll(`.fides-card-count-item--rp[data-issuer-id="${CSS.escape(issuer.id)}"] .fides-card-rp-count`).forEach((el) => {
          el.textContent = count;
        });
      });
    });
  }

  function checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('issuer');
    if (id) openModal(id);
  }

  async function loadVocabulary(primaryUrl, fallbackUrl) {
    const tryLoad = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data.terms || null;
    };
    if (primaryUrl) {
      try { return await tryLoad(primaryUrl); } catch (e) { console.warn('Vocabulary load failed (primary):', e.message); }
    }
    if (fallbackUrl) {
      try {
        const terms = await tryLoad(fallbackUrl);
        if (terms) console.log('Vocabulary loaded from fallback');
        return terms;
      } catch (e) { console.warn('Vocabulary load failed (fallback):', e.message); }
    }
    return null;
  }

  function hideVocabularyPopup() {
    const overlay = document.querySelector('.fides-vocab-overlay');
    const popup = document.querySelector('.fides-vocab-popup');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
  }

  function showVocabularyPopup(button, groupEl, vocabKey) {
    hideVocabularyPopup();
    const groupTerm = vocabulary[vocabKey];
    const categoryName = (groupEl.querySelector('.fides-filter-label') || {}).textContent?.trim() || '';
    let html = '';
    if (categoryName) html += '<p class="fides-vocab-popup-title"><strong>' + escapeHtml(categoryName) + '</strong></p>';
    if (groupTerm && groupTerm.description) html += '<p class="fides-vocab-popup-intro">' + escapeHtml(groupTerm.description) + '</p>';
    const optionsEl = groupEl.querySelector('.fides-filter-options');
    if (optionsEl) {
      const labels = optionsEl.querySelectorAll('label.fides-filter-checkbox');
      if (labels.length > 0) {
        const listItems = [];
        labels.forEach((label) => {
          const input = label.querySelector('input');
          const value = input ? (input.dataset.value || input.value) : '';
          const labelText = (label.querySelector('span') || label).textContent.trim();
          const term = vocabulary[value] || null;
          const desc = term && term.description ? escapeHtml(term.description) : '';
          listItems.push({ labelText, desc });
        });
        const hasAnyOptionDesc = listItems.some((item) => item.desc);
        if (hasAnyOptionDesc) {
          html += '<ul class="fides-vocab-popup-list">';
          listItems.forEach((item) => {
            html += '<li><strong>' + escapeHtml(item.labelText) + '</strong>' + (item.desc ? ': ' + item.desc : '') + '</li>';
          });
          html += '</ul>';
        }
      }
    }
    if (!html) html = '<p>No description available.</p>';
    const popup = document.createElement('div');
    popup.className = 'fides-vocab-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Filter explanation');
    popup.innerHTML = html;
    const overlay = document.createElement('div');
    overlay.className = 'fides-vocab-overlay';
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    const margin = 20;
    const rect = button.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const left = Math.max(margin, Math.min(rect.right + 40, w - pw - margin));
    const top = Math.max(margin, Math.min((h - ph) / 2, h - ph - margin));
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    setTimeout(() => { overlay.classList.add('visible'); popup.classList.add('visible'); }, 10);
    const close = (e) => {
      if (e && e.target.closest && e.target.closest('.fides-vocab-popup')) return;
      hideVocabularyPopup();
      document.removeEventListener('click', close, true);
      document.removeEventListener('keydown', onKeydown);
    };
    function onKeydown(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKeydown);
    setTimeout(() => document.addEventListener('click', close, true), 0);
  }

  function initVocabularyInfo(containerEl) {
    if (!vocabulary) return;
    hideVocabularyPopup();
    containerEl.querySelectorAll('.fides-vocab-info').forEach((btn) => btn.remove());
    containerEl.querySelectorAll('.fides-filter-group').forEach((groupEl) => {
      const toggle = groupEl.querySelector('.fides-filter-label-toggle');
      const labelSpan = toggle && toggle.querySelector('.fides-filter-label');
      if (!toggle || !labelSpan) return;
      const filterGroup = groupEl.dataset.filterGroup;
      const vocabKey = ISSUER_FILTER_TO_VOCAB[filterGroup] || filterGroup;
      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'fides-vocab-info';
      infoBtn.dataset.group = vocabKey;
      infoBtn.setAttribute('aria-label', 'Explain filter');
      infoBtn.textContent = 'i';
      infoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showVocabularyPopup(e.currentTarget, groupEl, vocabKey);
      });
      const parent = labelSpan.parentNode;
      if (parent.classList && parent.classList.contains('fides-filter-label-with-info')) {
        parent.appendChild(infoBtn);
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'fides-filter-label-with-info';
      parent.insertBefore(wrapper, labelSpan);
      wrapper.appendChild(labelSpan);
      wrapper.appendChild(infoBtn);
      const spacer = document.createElement('span');
      spacer.className = 'fides-filter-toggle-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      parent.insertBefore(spacer, wrapper.nextSibling);
    });
  }

  async function loadIssuers() {
    const sources = [
      { url: config.githubDataUrl, name: 'GitHub' },
      { url: `${config.pluginUrl}data/aggregated.json`, name: 'Local' },
    ];
    for (const source of sources) {
      if (!source.url) continue;
      try {
        const res = await fetch(source.url);
        if (res.ok) {
          const data = await res.json();
          issuers = data.issuers || [];
          console.log(`Loaded ${issuers.length} issuers from ${source.name}`);
          break;
        }
      } catch (err) {
        console.warn(`Failed to load from ${source.name}:`, err.message);
      }
    }
    filterFacets = computeFilterFacets(issuers);
    if (config.vocabularyUrl || config.vocabularyFallbackUrl) {
      vocabulary = await loadVocabulary(config.vocabularyUrl, config.vocabularyFallbackUrl);
    }
    render();
    checkDeepLink();
  }

  function readQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const issuersParam = params.get('issuers');
    if (issuersParam) {
      const ids = issuersParam.split(',').map((id) => decodeURIComponent(id.trim())).filter(Boolean);
      originalIssuerIds = ids;
      filters.ids = [...ids];
    }
  }

  function init() {
    root = document.getElementById('fides-issuer-catalog-root');
    if (!root) return;
    settings = {
      showFilters: root.dataset.showFilters !== 'false',
      showSearch: root.dataset.showSearch !== 'false',
      columns: root.dataset.columns || '3',
      theme: root.dataset.theme || 'fides',
    };
    root.setAttribute('data-theme', settings.theme);
    readQueryParams();
    loadIssuers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
