import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildImportPlan,
  emptyState,
  mergeIssuerIntoCatalog,
  type WpExportEntry,
} from './import-wp-submissions.ts';

const issuer = (id: string, displayName: string): WpExportEntry => ({
  itemId: id,
  slug: 'acme',
  filename: 'issuer-catalog.json',
  source: 'wordpress',
  document: {
    orgId: 'org:acme',
    issuers: [{
      id,
      displayName,
      environment: 'production',
      issuanceProtocol: 'oid4vci',
      oid4vciMetadataUrl: 'https://issuer.example/.well-known/openid-credential-issuer',
    }],
  },
});

test('merge appends and updates one issuer while preserving siblings', () => {
  const first = issuer('issuer:acme:first:production', 'First');
  const second = issuer('issuer:acme:second:production', 'Second');
  let doc = mergeIssuerIntoCatalog(null, first);
  doc = mergeIssuerIntoCatalog(doc, second);
  doc = mergeIssuerIntoCatalog(doc, issuer('issuer:acme:first:production', 'First updated'));
  assert.equal(doc.issuers?.length, 2);
  assert.equal(doc.issuers?.find((item) => item.id === first.itemId)?.displayName, 'First updated');
  assert.equal(doc.issuers?.find((item) => item.id === second.itemId)?.displayName, 'Second');
});

test('merge preserves the exported lastUpdated value', () => {
  const entry = issuer('issuer:acme:dated:production', 'Dated');
  entry.document.lastUpdated = '2026-08-11T12:00:00+00:00';
  assert.equal(mergeIssuerIntoCatalog(null, entry).lastUpdated, entry.document.lastUpdated);
});

test('buildImportPlan groups entries and prunes missing managed issuers', () => {
  const state = emptyState();
  state.managedIssuers = [{ slug: 'oldco', issuerId: 'issuer:oldco:legacy:test' }];
  const plan = buildImportPlan([issuer('issuer:acme:first:production', 'First')], state);
  assert.equal(plan.groups.length, 1);
  assert.equal(plan.groups[0]?.entries.length, 1);
  assert.deepEqual(plan.prune, state.managedIssuers);
  assert.equal(plan.skipped.length, 0);
});

test('buildImportPlan rejects unsafe metadata and invalid issuer ids', () => {
  const bad = issuer('not-an-issuer', 'Bad');
  bad.slug = '../escape';
  const plan = buildImportPlan([bad], emptyState());
  assert.equal(plan.groups.length, 0);
  assert.equal(plan.skipped.length, 1);
});
