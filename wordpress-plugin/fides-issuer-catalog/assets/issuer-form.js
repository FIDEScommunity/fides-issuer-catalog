(function () {
  "use strict";

  const config = window.FIDES_ISSUER_FORM_CONFIG || {};
  const mode = config.mode === "update" ? "update" : "create";
  const root =
    document.getElementById(mode === "update" ? "fides-issuer-update-form-root" : "fides-issuer-submit-form-root") ||
    document.querySelector(".fides-issuer-submission-root");
  if (!root) return;

  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const nonce = String(config.restNonce || "");
  const contactEmail = String(config.contactEmail || "");
  let selectedIssuerId = mode === "update" ? String(config.preselectIssuerId || "") : "";
  let selectedOrg = null;
  let supportedWallets = [];
  let credentialRefs = [];

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const options = (values, selected) =>
    (Array.isArray(values) ? values : [])
      .map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`)
      .join("");

  root.innerHTML = `
    <section class="fides-use-case-card">
      <form id="fides-issuer-form" class="fides-use-case-form fides-issuer-form" novalidate>
        <section class="fides-form-section fides-form-section-first" aria-labelledby="fides-issuer-form-title">
          <h3 id="fides-issuer-form-title" class="fides-form-section-title">${mode === "update" ? "Suggest an issuer update" : "Submit an issuer"}</h3>
          <p class="fides-form-section-intro">${mode === "update"
            ? "Find the issuer you want to update. You can review its current catalog information before submitting your proposal."
            : "First select the organization responsible for this issuer. You can then add the issuer details."}</p>

          <div class="fides-form-section-body fides-issuer-picker-body">
            <div class="fides-linked-field fides-lookup-field" id="fides-issuer-primary-lookup">
              <label for="fides-issuer-primary-search">${mode === "update" ? "Find issuer" : "Organization"} *</label>
              <p class="fides-help">${mode === "update" ? "Search by issuer name or stable issuer ID." : "Start typing the organization name or ID."}</p>
              <input id="fides-issuer-primary-search" type="search" autocomplete="off"
                placeholder="${mode === "update" ? "Start typing issuer name or ID…" : "Start typing organization name…"}" />
              <p class="fides-lookup-hint" hidden></p>
              <ul class="fides-lookup-results" role="listbox" aria-label="Search results"></ul>
            </div>
            <div id="fides-issuer-selection" class="fides-update-banner-row" hidden>
              <div class="fides-update-banner">
                <span>${mode === "update" ? "Updating:" : "Organization:"}</span>
                <strong id="fides-issuer-selection-label"></strong>
              </div>
              <button type="button" class="fides-secondary-btn" id="fides-issuer-change">Choose different</button>
            </div>
          </div>

          <div id="fides-issuer-fields" class="fides-form-section-body fides-issuer-fields" hidden>
          <div class="fides-form-grid fides-form-grid-pair">
            <div class="fides-form-row">
              <label for="fides-issuer-key">Issuer key *</label>
              <p class="fides-help">Use lowercase letters, numbers, and hyphens.</p>
              <input id="fides-issuer-key" required pattern="[a-z0-9-]+" maxlength="80"
                ${mode === "update" ? "readonly aria-readonly=\"true\"" : ""}
                placeholder="my-issuer" />
            </div>
            <div class="fides-form-row">
              <label for="fides-issuer-environment">Environment *</label>
              <p class="fides-help">${mode === "update"
                ? "Environment is part of the issuer ID and cannot be changed in an update."
                : "Choose production or test."}</p>
              <select id="fides-issuer-environment" required ${mode === "update" ? "disabled aria-disabled=\"true\"" : ""}>
                ${options(config.environments, "production")}
              </select>
            </div>
          </div>
          <input id="fides-issuer-id" type="hidden" />
          <div class="fides-form-grid fides-form-grid-pair">
            <div class="fides-form-row">
              <label for="fides-issuer-display-name">Display name</label>
              <input id="fides-issuer-display-name" maxlength="200" placeholder="Name shown in the catalog" />
            </div>
            <div class="fides-form-row">
              <label for="fides-issuer-project-context">Project context</label>
              <input id="fides-issuer-project-context" maxlength="300" placeholder="e.g. EUDI Wallet LSP" />
            </div>
          </div>
          <div class="fides-form-row">
            <label for="fides-issuer-description">Description</label>
            <p class="fides-help">Briefly explain what this issuer provides and who it serves.</p>
            <textarea id="fides-issuer-description" rows="4" maxlength="2000"></textarea>
            <div class="fides-field-meta">
              <p class="fides-description-counter" id="fides-issuer-description-counter" aria-live="polite"></p>
            </div>
          </div>
          <div class="fides-form-row">
            <label for="fides-issuer-contact">Contact email</label>
            <p class="fides-help">Taken from your account for review purposes. It will not be published.</p>
            <input id="fides-issuer-contact" class="fides-input-locked" type="email" value="${escapeHtml(contactEmail)}"
              readonly aria-readonly="true" tabindex="-1" />
          </div>
            </div>
        </section>

        <div id="fides-issuer-additional-sections" class="fides-issuer-additional-sections" hidden>
          <section class="fides-form-section" aria-labelledby="fides-issuer-issuance-title">
            <h3 id="fides-issuer-issuance-title" class="fides-form-section-title">Issuance information</h3>
            <p class="fides-form-section-intro">Technical information used to discover and understand the issuer.</p>
            <div class="fides-form-section-body">
          <div class="fides-form-grid fides-form-grid-pair">
            <div class="fides-form-row">
              <label for="fides-issuer-protocol">Issuance protocol *</label>
              <select id="fides-issuer-protocol" required>
                ${options(config.protocols, "oid4vci")}
              </select>
            </div>
            <div class="fides-form-row">
              <label for="fides-issuer-website">Issuer website URL</label>
              <input id="fides-issuer-website" type="url" placeholder="https://…" />
            </div>
          </div>
          <div class="fides-form-row" id="fides-issuer-metadata-row">
            <label for="fides-issuer-metadata">OID4VCI metadata URL *</label>
            <p class="fides-help">The OpenID Credential Issuer metadata endpoint.</p>
            <input id="fides-issuer-metadata" type="url" placeholder="https://example.com/.well-known/openid-credential-issuer" />
          </div>
            </div>
          </section>

          <section id="fides-issuer-relations-section" class="fides-form-section" aria-labelledby="fides-issuer-relations-title" hidden>
            <h3 id="fides-issuer-relations-title" class="fides-form-section-title">Credential relationships</h3>
            <p class="fides-form-section-intro">Non-OID4VCI issuers need explicit references because no issuer metadata is available for automatic matching.</p>
            <div class="fides-form-section-body">
            <div class="fides-form-row fides-reference-picker" id="fides-issuer-credential-picker">
              <label for="fides-issuer-credential-search">Credential references <span id="fides-issuer-credential-required"></span></label>
              <p class="fides-help">Search and select credentials issued by this issuer.</p>
              <input id="fides-issuer-credential-search" type="search" autocomplete="off" placeholder="Start typing credential name or ID…" />
              <p class="fides-lookup-hint" hidden></p>
              <ul class="fides-lookup-results" role="listbox" aria-label="Credential search results"></ul>
              <div id="fides-issuer-credential-chips" class="fides-reference-chips"></div>
            </div>
            </div>
          </section>

        </div>
        <div id="fides-issuer-submit-block" class="fides-org-submit-block" hidden>
          <div class="fides-consent">
            <label><input type="checkbox" id="fides-issuer-consent" required /> I confirm this information may be published *</label>
          </div>
          <div class="fides-form-actions">
            <button type="submit">${mode === "update" ? "Submit update proposal" : "Submit issuer"}</button>
          </div>
        </div>
        <p id="fides-issuer-message" class="fides-form-message" aria-live="polite"></p>
      </form>
    </section>`;

  const form = root.querySelector("#fides-issuer-form");
  const fields = root.querySelector("#fides-issuer-fields");
  const additionalSections = root.querySelector("#fides-issuer-additional-sections");
  const selection = root.querySelector("#fides-issuer-selection");
  const selectionLabel = root.querySelector("#fides-issuer-selection-label");
  const primary = root.querySelector("#fides-issuer-primary-lookup");
  const primarySearch = root.querySelector("#fides-issuer-primary-search");
  const issuerKey = root.querySelector("#fides-issuer-key");
  const environment = root.querySelector("#fides-issuer-environment");
  const issuerId = root.querySelector("#fides-issuer-id");
  const protocol = root.querySelector("#fides-issuer-protocol");
  const metadata = root.querySelector("#fides-issuer-metadata");
  const description = root.querySelector("#fides-issuer-description");
  const descriptionCounter = root.querySelector("#fides-issuer-description-counter");
  const message = root.querySelector("#fides-issuer-message");
  const submitBlock = root.querySelector("#fides-issuer-submit-block");
  const submitButton = form.querySelector('button[type="submit"]');

  function setMessage(text, type = "") {
    message.textContent = text || "";
    message.className = `fides-form-message${type ? ` is-${type}` : ""}`;
  }

  function clearValidation() {
    root.querySelectorAll(".fides-form-row--invalid").forEach((row) => row.classList.remove("fides-form-row--invalid"));
    root.querySelectorAll(".fides-consent--invalid").forEach((row) => row.classList.remove("fides-consent--invalid"));
    root.querySelectorAll(".fides-form-field-invalid").forEach((control) => {
      control.classList.remove("fides-form-field-invalid");
      control.removeAttribute("aria-invalid");
    });
  }

  function highlightInvalid(control) {
    if (!control) return;
    control.classList.add("fides-form-field-invalid");
    control.setAttribute("aria-invalid", "true");
    const row = control.closest(".fides-form-row, .fides-consent");
    if (row) {
      row.classList.add(row.classList.contains("fides-consent") ? "fides-consent--invalid" : "fides-form-row--invalid");
    }
  }

  function headers(json = false) {
    const value = {};
    if (nonce) value["X-WP-Nonce"] = nonce;
    if (json) value["Content-Type"] = "application/json";
    return value;
  }

  /** WP REST item_id route allows [a-zA-Z0-9:._-]+ — encodeURIComponent breaks colons (issuer%3A → 404). */
  function itemIdPathSegment(itemId) {
    const id = String(itemId || "").trim();
    if (!/^issuer:[a-z0-9]+:[a-z0-9-]+:(production|test)$/.test(id)) {
      return "";
    }
    return id;
  }

  function submissionItemUrl(itemId) {
    const segment = itemIdPathSegment(itemId);
    if (!segment) return "";
    return `${apiBase}/submissions/issuer/${segment}`;
  }

  async function fetchLookup(type, query) {
    const response = await fetch(`${apiBase}/lookups/${type}?q=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      headers: headers(),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Lookup failed.");
    return Array.isArray(json.content) ? json.content : [];
  }

  function renderLookupResults(list, results, onSelect) {
    results.innerHTML = list
      .map((item, index) => `
        <li><button type="button" data-index="${index}" class="fides-lookup-option">
          <span class="fides-lookup-option-main"><strong>${escapeHtml(item.label || item.id)}</strong>${item.subtitle ? `<small>${escapeHtml(item.subtitle)}</small>` : ""}</span>
          <span class="fides-lookup-option-action">Select</span>
        </button></li>`)
      .join("");
    results.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => onSelect(list[Number(button.dataset.index)]));
    });
  }

  function wireLookup(input, type, onSelect) {
    const row = input.closest(".fides-lookup-field, .fides-reference-picker");
    const results = row.querySelector(".fides-lookup-results");
    const hint = row.querySelector(".fides-lookup-hint");
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const query = input.value.trim();
      results.innerHTML = "";
      hint.hidden = true;
      if (query.length < 2) return;
      timer = setTimeout(async () => {
        try {
          const items = await fetchLookup(type, query);
          hint.hidden = false;
          hint.textContent = items.length ? `${items.length} match${items.length === 1 ? "" : "es"} — click to select` : "No matches.";
          renderLookupResults(items, results, (item) => {
            results.innerHTML = "";
            hint.hidden = true;
            input.value = "";
            onSelect(item);
          });
        } catch (error) {
          hint.hidden = false;
          hint.textContent = error.message || "Lookup failed.";
        }
      }, 250);
    });
  }

  function orgCode() {
    return String(selectedOrg?.id || "").replace(/^org:/, "").replace(/-/g, "");
  }

  function updateIdPreview() {
    if (mode === "update") return;
    const key = String(issuerKey.value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
    issuerKey.value = key;
    issuerId.value = orgCode() && key ? `issuer:${orgCode()}:${key}:${environment.value}` : "";
  }

  function updateProtocolUi() {
    const oid4vci = protocol.value === "oid4vci";
    root.querySelector("#fides-issuer-metadata-row").hidden = !oid4vci;
    root.querySelector("#fides-issuer-relations-section").hidden = oid4vci;
    metadata.required = oid4vci;
    root.querySelector("#fides-issuer-credential-required").textContent = oid4vci ? "" : "*";
    root.querySelector("#fides-issuer-credential-picker").classList.toggle("is-required", !oid4vci);
    root.querySelector("#fides-issuer-credential-picker .fides-help").textContent = oid4vci
      ? "Search and select credentials issued by this issuer."
      : "At least one credential is required when the issuance protocol is “other”.";
  }

  function updateDescriptionCounter() {
    const maxLength = Number(description?.maxLength) || 2000;
    const length = String(description?.value || "").length;
    if (descriptionCounter) {
      descriptionCounter.textContent = `${length.toLocaleString("en-US")} / ${maxLength.toLocaleString("en-US")} characters`;
    }
  }

  function renderChips(kind) {
    const values = kind === "wallet" ? supportedWallets : credentialRefs;
    const mount = root.querySelector(kind === "wallet" ? "#fides-issuer-wallet-chips" : "#fides-issuer-credential-chips");
    if (!mount) return;
    mount.innerHTML = values
      .map((item) => `<span class="fides-reference-chip">${escapeHtml(item.displayName || item.id)}
        <button type="button" data-ref-kind="${kind}" data-ref-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.displayName || item.id)}">×</button>
      </span>`)
      .join("");
    mount.querySelectorAll("[data-ref-id]").forEach((button) => {
      button.addEventListener("click", () => {
        if (kind === "wallet") supportedWallets = supportedWallets.filter((item) => item.id !== button.dataset.refId);
        else credentialRefs = credentialRefs.filter((item) => item.id !== button.dataset.refId);
        renderChips(kind);
      });
    });
  }

  function addReference(kind, item) {
    const ref = { id: String(item.id || "").trim() };
    if (!ref.id) return;
    const label = String(item.label || "").trim();
    if (label && label !== ref.id) ref.displayName = label;
    if (kind === "wallet") {
      if (!supportedWallets.some((value) => value.id === ref.id)) supportedWallets.push(ref);
    } else if (!credentialRefs.some((value) => value.id === ref.id)) {
      credentialRefs.push(ref);
    }
    renderChips(kind);
  }

  function showSelection(label) {
    selection.hidden = false;
    primary.hidden = true;
    fields.hidden = false;
    additionalSections.hidden = false;
    submitBlock.hidden = false;
    selectionLabel.textContent = label;
  }

  function fill(payload) {
    selectedOrg = { id: payload.orgId || "", label: payload.orgId || "" };
    issuerId.value = payload.id || selectedIssuerId;
    const parts = issuerId.value.split(":");
    issuerKey.value = parts[2] || "";
    environment.value = payload.environment || parts[3] || "production";
    root.querySelector("#fides-issuer-display-name").value = payload.displayName || "";
    description.value = payload.description || "";
    updateDescriptionCounter();
    root.querySelector("#fides-issuer-project-context").value = payload.projectContext || "";
    protocol.value = payload.issuanceProtocol || "oid4vci";
    metadata.value = payload.oid4vciMetadataUrl || "";
    root.querySelector("#fides-issuer-website").value = payload.issuerWebsiteUrl || "";
    supportedWallets = Array.isArray(payload.supportedWallets) ? payload.supportedWallets : [];
    credentialRefs = Array.isArray(payload.credentialRefs) ? payload.credentialRefs : [];
    renderChips("wallet");
    renderChips("credential");
    updateProtocolUi();
  }

  async function loadIssuer(id) {
    setMessage("Loading issuer details…");
    const url = submissionItemUrl(id);
    if (!url) throw new Error("The selected issuer has an invalid ID.");
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: headers(),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Could not load issuer details.");
    fill(json.payload || {});
    showSelection(`${json.payload?.displayName || id} (${id})`);
    setMessage("");
  }

  function buildPayload() {
    return {
      orgId: String(selectedOrg?.id || ""),
      id: issuerId.value.trim(),
      displayName: root.querySelector("#fides-issuer-display-name").value.trim(),
      description: root.querySelector("#fides-issuer-description").value.trim(),
      environment: environment.value,
      issuanceProtocol: protocol.value,
      oid4vciMetadataUrl: protocol.value === "oid4vci" ? metadata.value.trim() : "",
      issuerWebsiteUrl: root.querySelector("#fides-issuer-website").value.trim(),
      projectContext: root.querySelector("#fides-issuer-project-context").value.trim(),
      supportedWallets,
      credentialRefs,
    };
  }

  wireLookup(primarySearch, mode === "update" ? "issuer" : "organization", async (item) => {
    if (mode === "create") {
      selectedOrg = { id: String(item.id || ""), label: String(item.label || item.id || "") };
      showSelection(`${selectedOrg.label} (${selectedOrg.id})`);
      updateIdPreview();
    } else {
      selectedIssuerId = String(item.id || "");
      try {
        await loadIssuer(selectedIssuerId);
      } catch (error) {
        setMessage(error.message, "error");
      }
    }
  });
  wireLookup(root.querySelector("#fides-issuer-credential-search"), "credential", (item) => addReference("credential", item));

  root.querySelector("#fides-issuer-change").addEventListener("click", () => {
    selectedIssuerId = "";
    selectedOrg = null;
    supportedWallets = [];
    credentialRefs = [];
    form.reset();
    updateDescriptionCounter();
    selection.hidden = true;
    primary.hidden = false;
    fields.hidden = true;
    additionalSections.hidden = true;
    submitBlock.hidden = true;
    primarySearch.focus();
    setMessage("");
  });
  issuerKey.addEventListener("input", updateIdPreview);
  environment.addEventListener("change", updateIdPreview);
  protocol.addEventListener("change", updateProtocolUi);
  description.addEventListener("input", updateDescriptionCounter);
  form.addEventListener("input", (event) => {
    const control = event.target;
    if (!(control instanceof HTMLElement)) return;
    control.classList.remove("fides-form-field-invalid");
    control.removeAttribute("aria-invalid");
    const row = control.closest(".fides-form-row, .fides-consent");
    if (row) {
      row.classList.remove("fides-form-row--invalid", "fides-consent--invalid");
    }
  });
  updateProtocolUi();
  updateDescriptionCounter();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearValidation();
    setMessage("");
    if (!form.checkValidity()) {
      const invalid = form.querySelector(":invalid");
      highlightInvalid(invalid);
      setMessage("Please complete all required fields.", "error");
      invalid?.focus();
      form.reportValidity();
      return;
    }
    if (!contactEmail) {
      setMessage("Your account needs a valid email address.", "error");
      return;
    }
    const payload = buildPayload();
    if (!payload.orgId || !/^issuer:[a-z0-9]+:[a-z0-9-]+:(production|test)$/.test(payload.id)) {
      setMessage("Select an organization and enter a valid issuer key.", "error");
      return;
    }
    if (payload.issuanceProtocol === "other" && !payload.credentialRefs.length) {
      setMessage("Select at least one credential for a non-OID4VCI issuer.", "error");
      const credentialSearch = root.querySelector("#fides-issuer-credential-search");
      highlightInvalid(credentialSearch);
      credentialSearch.focus();
      return;
    }
    const url = mode === "update"
      ? submissionItemUrl(selectedIssuerId)
      : `${apiBase}/submissions/issuer`;
    if (!url) {
      setMessage("Select a valid issuer before submitting the update.", "error");
      return;
    }
    setMessage("Submitting…");
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: headers(true),
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Submission failed.");
      setMessage(
        mode === "update"
          ? "Update proposal received. It will be reviewed before publication."
          : "Submission received. It will be reviewed before publication.",
        "success"
      );
      fields.hidden = true;
      additionalSections.hidden = true;
      selection.hidden = true;
      submitBlock.hidden = true;
    } catch (error) {
      setMessage(error.message || "Submission failed due to a network error.", "error");
    } finally {
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });

  if (mode === "update" && selectedIssuerId) {
    loadIssuer(selectedIssuerId).catch((error) => setMessage(error.message, "error"));
  }
})();
