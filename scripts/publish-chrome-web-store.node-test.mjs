import {
  createVerify,
  generateKeyPairSync,
} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createServiceAccountAssertion,
  findExistingVersion,
  normalizeVersion,
  parseServiceAccountCredentials,
} from './publish-chrome-web-store.mjs';

test('creates a signed service account assertion for the Chrome Web Store scope', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2_048,
  });
  const credentials = {
    type: 'service_account',
    client_email: 'publisher@example.iam.gserviceaccount.com',
    private_key: privateKey.export({
      format: 'pem',
      type: 'pkcs8',
    }),
  };
  const assertion = createServiceAccountAssertion(credentials, 1_700_000_000);
  const [encodedHeader, encodedClaims, encodedSignature] =
    assertion.split('.');
  const header = JSON.parse(
    Buffer.from(encodedHeader, 'base64url').toString('utf8'),
  );
  const claims = JSON.parse(
    Buffer.from(encodedClaims, 'base64url').toString('utf8'),
  );
  const signatureIsValid = createVerify('RSA-SHA256')
    .update(`${encodedHeader}.${encodedClaims}`)
    .end()
    .verify(publicKey, Buffer.from(encodedSignature, 'base64url'));

  assert.deepEqual(header, {
    alg: 'RS256',
    typ: 'JWT',
  });
  assert.equal(
    claims.scope,
    'https://www.googleapis.com/auth/chromewebstore',
  );
  assert.equal(claims.aud, 'https://oauth2.googleapis.com/token');
  assert.equal(claims.iat, 1_700_000_000);
  assert.equal(claims.exp, 1_700_003_600);
  assert.equal(signatureIsValid, true);
});

test('rejects credentials that are not a service account JSON key', () => {
  assert.throws(
    () => parseServiceAccountCredentials('{"type":"authorized_user"}'),
    /service account JSON key/,
  );
  assert.throws(
    () => parseServiceAccountCredentials('not-json'),
    /valid JSON/,
  );
});

test('normalizes release tag versions', () => {
  assert.equal(normalizeVersion('v2.4.0'), '2.4.0');
  assert.equal(normalizeVersion('2.4.0'), '2.4.0');
});

test('detects an already submitted or published release', () => {
  const status = {
    publishedItemRevisionStatus: {
      state: 'PUBLISHED',
      distributionChannels: [
        {
          crxVersion: '2.3.0',
        },
      ],
    },
    submittedItemRevisionStatus: {
      state: 'IN_REVIEW',
      distributionChannels: [
        {
          crxVersion: '2.4.0',
        },
      ],
    },
  };

  assert.deepEqual(findExistingVersion(status, '2.4.0'), {
    kind: 'submitted',
    state: 'IN_REVIEW',
  });
  assert.equal(findExistingVersion(status, '3.0.0'), undefined);
});
