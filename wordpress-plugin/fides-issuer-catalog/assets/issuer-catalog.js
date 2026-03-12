/**
 * FIDES Issuer Catalog - WordPress Plugin JavaScript
 */

(function () {
  'use strict';

  const icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>',
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
  };

  const ENVIRONMENT_LABELS = {
    production: 'Production',
    pilot: 'Pilot',
    test: 'Test',
    sandbox: 'Sandbox',
  };

  const config = window.fidesIssuerCatalog || {
    pluginUrl: '',
    githubDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json',
    credentialCatalogUrl: 'https://fides.community/community-tools/credential-catalog/',
  };

  let issuers = [];
  let filterFacets = null;
  let sortBy = 'lastUpdated';
  let selectedIssuer = null;

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
  };

  let container;
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
      (filters.addedLast30Days ? 1 : 0)
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
    });
    return facets;
  }

  function getFilteredIssuers() {
    return issuers.filter((issuer) => {
      if (filters.addedLast30Days && !isWithinLastDays(issuer.firstSeenAt, 30)) return false;
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
    const updatedDate = issuer.updatedAt ? formatDate(issuer.updatedAt) : '';
    const logo = issuer.logoUri || issuer.organization?.logoUri;

    const formats = [...new Set(configs.map((c) => c.vcFormat).filter(Boolean))];
    const credentials = configs.filter((c) => c.credentialCatalogRef?.displayName);
    const visibleCredentials = credentials.slice(0, 3);
    const hiddenCount = credentials.length - visibleCredentials.length;

    const credentialItems = visibleCredentials.map((cc) =>
      `<li class="fides-issuer-credential-item">${icons.fileCheck} <span title="${escapeHtml(cc.credentialCatalogRef.displayName)}">${escapeHtml(cc.credentialCatalogRef.displayName)}</span></li>`
    ).join('');

    return `
      <article class="fides-issuer-card" data-id="${escapeHtml(issuer.id)}" tabindex="0" role="button" aria-label="${escapeHtml(issuer.displayName)}">
        <div class="fides-issuer-card-header">
          <div class="fides-issuer-logo-wrap">
            ${logo
              ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(issuer.organization?.name || '')}" class="fides-issuer-logo">`
              : `<div class="fides-issuer-logo-placeholder">${icons.server}</div>`
            }
          </div>
          <div class="fides-issuer-header-text">
            <p class="fides-issuer-org" title="${escapeHtml(issuer.organization?.name || '')}">${escapeHtml(issuer.organization?.name || '')}</p>
            <h3 class="fides-issuer-name" title="${escapeHtml(issuer.displayName)}">${escapeHtml(issuer.displayName)}</h3>
          </div>
          ${renderEnvironmentBadge(issuer.environment)}
        </div>
        <div class="fides-issuer-card-body">
          ${credentials.length > 0 ? `
            <ul class="fides-issuer-credentials-list">
              ${credentialItems}
              ${hiddenCount > 0 ? `<li class="fides-issuer-credential-more">+ ${hiddenCount} more</li>` : ''}
            </ul>
          ` : `<p class="fides-issuer-no-credentials">No linked credentials</p>`}
        </div>
        <div class="fides-issuer-card-footer">
          <div class="fides-tags">
            ${formats.map((f) => `<span class="fides-tag">${escapeHtml(f)}</span>`).join('')}
          </div>
          ${updatedDate ? `<span class="fides-issuer-updated">Updated ${escapeHtml(updatedDate)}</span>` : ''}
        </div>
        <div class="fides-card-actions">
          <button class="fides-card-btn fides-view-details-btn" data-id="${escapeHtml(issuer.id)}">View details</button>
        </div>
      </article>
    `;
  }

  function renderModal() {
    if (!selectedIssuer) return '';
    const issuer = selectedIssuer;
    const logo = issuer.logoUri || issuer.organization?.logoUri;
    const configs = issuer.credentialConfigurations || [];
    const credentialsWithRef = configs.filter((c) => c.credentialCatalogRef);
    const theme = container.dataset.theme || 'fides';

    return `
      <div class="fides-modal-overlay" id="fides-modal-overlay" role="dialog" aria-modal="true" aria-label="${escapeHtml(issuer.displayName)}">
        <div class="fides-modal">
          <div class="fides-modal-header">
            <div class="fides-modal-logo-wrap">
              ${logo
                ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(issuer.organization?.name || '')}" class="fides-modal-logo">`
                : `<div class="fides-modal-logo-placeholder">${icons.server}</div>`
              }
            </div>
            <div class="fides-modal-header-text">
              <p class="fides-modal-provider">${escapeHtml(issuer.organization?.name || '')}</p>
              <h2 class="fides-modal-title">${escapeHtml(issuer.displayName)}</h2>
              <div class="fides-modal-header-meta">
                ${renderEnvironmentBadge(issuer.environment)}
                ${issuer.credentialIssuerUrl
                  ? `<a href="${escapeHtml(issuer.credentialIssuerUrl)}" class="fides-modal-issuer-url" target="_blank" rel="noopener">${escapeHtml(issuer.credentialIssuerUrl)} ${icons.externalLinkSmall}</a>`
                  : ''}
              </div>
            </div>
            <div class="fides-modal-header-actions">
              <button class="fides-modal-action-btn" id="fides-modal-copy-link" title="Copy link">${icons.share}</button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">${icons.xLarge}</button>
            </div>
          </div>
          <div class="fides-modal-body">
            <div class="fides-modal-info-blocks">
              <!-- Block 1: Issuer details -->
              <div class="fides-modal-info-block">
                <h3 class="fides-modal-section-title fides-modal-section-first">${icons.building} Issuer details</h3>
                <dl class="fides-modal-details">
                  <div class="fides-modal-detail-row">
                    <dt>Environment</dt>
                    <dd>${renderEnvironmentBadge(issuer.environment)}</dd>
                  </div>
                  ${issuer.projectContext ? `
                    <div class="fides-modal-detail-row">
                      <dt>Project</dt>
                      <dd>${escapeHtml(issuer.projectContext)}</dd>
                    </div>
                  ` : ''}
                  ${issuer.organization?.did ? `
                    <div class="fides-modal-detail-row">
                      <dt>DID</dt>
                      <dd><span class="fides-mono" title="${escapeHtml(issuer.organization.did)}">${escapeHtml(issuer.organization.did)}</span></dd>
                    </div>
                  ` : ''}
                  <div class="fides-modal-detail-row">
                    <dt>Protocol</dt>
                    <dd><span class="fides-tag">OID4VCI</span></dd>
                  </div>
                  ${issuer.updatedAt ? `
                    <div class="fides-modal-detail-row">
                      <dt>Updated</dt>
                      <dd>${escapeHtml(formatDate(issuer.updatedAt))}</dd>
                    </div>
                  ` : ''}
                  ${issuer.firstSeenAt ? `
                    <div class="fides-modal-detail-row">
                      <dt>First seen</dt>
                      <dd>${escapeHtml(formatDate(issuer.firstSeenAt))}</dd>
                    </div>
                  ` : ''}
                </dl>
              </div>

              <!-- Block 2: Issued credentials -->
              <div class="fides-modal-info-block">
                <h3 class="fides-modal-section-title fides-modal-section-first">${icons.fileCheck} Issued credentials</h3>
                ${credentialsWithRef.length > 0 ? `
                  <ul class="fides-modal-credential-list">
                    ${credentialsWithRef.map((cc) => {
                      const url = config.credentialCatalogUrl
                        ? `${config.credentialCatalogUrl.replace(/\/$/, '')}?credential=${encodeURIComponent(cc.credentialCatalogRef.id)}`
                        : '#';
                      return `<li>
                        <a href="${escapeHtml(url)}" class="fides-tag wallet-link" target="_blank" rel="noopener">
                          ${escapeHtml(cc.credentialCatalogRef.displayName || cc.credentialCatalogRef.id)} ${icons.externalLinkSmall}
                        </a>
                      </li>`;
                    }).join('')}
                  </ul>
                ` : `<p class="fides-modal-empty">No linked credentials found.</p>`}
              </div>
            </div>

            <!-- Credential configurations table -->
            ${configs.length > 0 ? `
              <div class="fides-modal-info-block fides-modal-info-block-full">
                <h3 class="fides-modal-section-title fides-modal-section-first">${icons.shield} Credential configurations</h3>
                <div class="fides-table-wrap">
                  <table class="fides-attributes-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Format</th>
                        <th>Signing algorithms</th>
                        <th>Proof types</th>
                        <th>Credential catalog</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${configs.map((cc) => `
                        <tr>
                          <td>${escapeHtml(cc.displayName || cc.configurationId)}</td>
                          <td><span class="fides-tag">${escapeHtml(cc.vcFormat)}</span></td>
                          <td>${(cc.signingAlgorithms || []).map((a) => `<span class="fides-tag">${escapeHtml(a)}</span>`).join(' ')}</td>
                          <td>${(cc.proofTypes || []).map((p) => `<span class="fides-tag">${escapeHtml(p)}</span>`).join(' ')}</td>
                          <td>${cc.credentialCatalogRef
                            ? `<a href="${escapeHtml((config.credentialCatalogUrl || '').replace(/\/$/, '') + '?credential=' + encodeURIComponent(cc.credentialCatalogRef.id))}" class="fides-tag wallet-link" target="_blank" rel="noopener">${escapeHtml(cc.credentialCatalogRef.displayName || cc.credentialCatalogRef.id)} ${icons.externalLinkSmall}</a>`
                            : '<span class="fides-modal-empty">—</span>'
                          }</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- OID4VCI metadata link -->
            <div class="fides-modal-section">
              <h3 class="fides-modal-section-title">${icons.link} Metadata</h3>
              <div class="fides-modal-links">
                <a href="${escapeHtml(issuer.oid4vciMetadataUrl)}" class="fides-modal-link" target="_blank" rel="noopener">
                  ${icons.shield} .well-known/openid-credential-issuer ${icons.externalLinkSmall}
                </a>
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
              <span>${escapeHtml(ENVIRONMENT_LABELS[opt] || opt)}<span class="fides-filter-option-count">(${facets?.[key]?.[opt] || 0})</span></span>
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
      ${renderModal()}
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
    const theme = container?.dataset?.theme || 'fides';
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
    const modalEl = root.querySelector('#fides-modal-overlay');
    if (modalEl) { modalEl.remove(); }
    root.insertAdjacentHTML('beforeend', renderModal());
    document.body.style.overflow = 'hidden';
    bindModalEvents();
    const params = new URLSearchParams(window.location.search);
    params.set('issuer', id);
    history.replaceState(null, '', '?' + params.toString());
  }

  function closeModal() {
    selectedIssuer = null;
    const overlay = root.querySelector('#fides-modal-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    const params = new URLSearchParams(window.location.search);
    params.delete('issuer');
    const qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  function bindModalEvents() {
    const closeBtn = root.querySelector('#fides-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const overlay = root.querySelector('#fides-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    }

    const copyBtn = root.querySelector('#fides-modal-copy-link');
    if (copyBtn) copyBtn.addEventListener('click', copyIssuerLink);

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
      filters = { search: '', environment: [], organization: [], vcFormat: [], credential: [], signingAlgorithm: [], addedLast30Days: false };
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

    root.querySelectorAll('.fides-kpi-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.kpiAction;
        if (action === 'reset') { filters.environment = []; filters.addedLast30Days = false; sortBy = 'lastUpdated'; }
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
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fides-card-btn')) return;
        openModal(card.dataset.id);
      });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });
    root.querySelectorAll('.fides-view-details-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(btn.dataset.id); });
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
  }

  function renderIssuerGridOnly() {
    const grid = root.querySelector('.fides-issuer-grid');
    if (!grid) return;
    const filtered = getFilteredIssuers();
    grid.innerHTML = filtered.length > 0
      ? filtered.map(renderIssuerCard).join('')
      : '<p class="fides-empty">No issuers found.</p>';
    root.querySelectorAll('.fides-issuer-card').forEach((card) => {
      card.addEventListener('click', (e) => { if (e.target.closest('.fides-card-btn')) return; openModal(card.dataset.id); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });
    root.querySelectorAll('.fides-view-details-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(btn.dataset.id); });
    });
  }

  function checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('issuer');
    if (id) openModal(id);
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
    render();
    checkDeepLink();
  }

  let root;
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
    loadIssuers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
