import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyManualCredentialRefs,
  catalogCredentialKey,
  findRefForConfig,
} from './credentialRefs.js';

describe('catalogCredentialKey', () => {
  it('reads the credential key from a catalog id', () => {
    assert.equal(catalogCredentialKey('cred:verana:cexa-kyc:sd-jwt-vc'), 'cexa-kyc');
  });
});

describe('findRefForConfig', () => {
  const refs = [
    { id: 'cred:verana:cexa-kyc:sd-jwt-vc' },
    { id: 'cred:verana:ecs-service:vcdm-2-0' },
  ];

  it('matches an OID4VCI configuration id to the catalog key without displayName', () => {
    const match = findRefForConfig({ configurationId: 'cexa-kyc', displayName: 'cexa-kyc' }, refs, new Set());
    assert.equal(match?.id, 'cred:verana:cexa-kyc:sd-jwt-vc');
  });

  it('matches a shortened configuration id to the catalog key', () => {
    const match = findRefForConfig(
      { configurationId: 'verandia-legal-rep', displayName: 'verandia-legal-rep' },
      [
        { id: 'cred:verana:verandia-legal-representative:sd-jwt-vc' },
        { id: 'cred:verana:ecs-organization:vcdm-2-0' },
        { id: 'cred:verana:ecs-service:vcdm-2-0' },
      ],
      new Set()
    );
    assert.equal(match?.id, 'cred:verana:verandia-legal-representative:sd-jwt-vc');
  });

  it('matches a VCT URL tail to the catalog key', () => {
    const match = findRefForConfig(
      {
        configurationId: 'opaque-config',
        vct: 'https://novara.cexa.playground.testnet.verana.network/oid4vc/vct/cexa-kyc',
      },
      refs,
      new Set()
    );
    assert.equal(match?.id, 'cred:verana:cexa-kyc:sd-jwt-vc');
  });
});

describe('applyManualCredentialRefs', () => {
  it('links the matching config and keeps leftover refs as manual configurations', () => {
    const configs = [
      {
        configurationId: 'cexa-kyc',
        displayName: 'cexa-kyc',
        vcFormat: 'sd_jwt_vc',
        signingAlgorithms: [],
        proofTypes: [],
        cryptographicBindingMethods: [],
      },
    ];
    const result = applyManualCredentialRefs(
      configs,
      [
        { id: 'cred:verana:cexa-kyc:sd-jwt-vc' },
        { id: 'cred:verana:ecs-service:vcdm-2-0' },
      ],
      [
        { id: 'cred:verana:cexa-kyc:sd-jwt-vc', displayName: 'CEXA-Kyc' },
        { id: 'cred:verana:ecs-service:vcdm-2-0', displayName: 'ECS Service Credential' },
      ]
    );

    assert.equal(result.length, 2);
    assert.equal(result[0].credentialCatalogRef?.id, 'cred:verana:cexa-kyc:sd-jwt-vc');
    assert.equal(result[0].credentialCatalogRef?.displayName, 'CEXA-Kyc');
    assert.equal(result[1].configurationId, 'manual:cred:verana:ecs-service:vcdm-2-0');
    assert.equal(result[1].credentialCatalogRef?.id, 'cred:verana:ecs-service:vcdm-2-0');
  });
});
