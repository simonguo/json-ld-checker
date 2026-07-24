import {
  createSign,
} from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME_WEB_STORE_SCOPE =
  'https://www.googleapis.com/auth/chromewebstore';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const API_ENDPOINT = 'https://chromewebstore.googleapis.com';
const UPLOAD_POLL_ATTEMPTS = 20;
const UPLOAD_POLL_INTERVAL_MS = 3_000;
const REQUEST_TIMEOUT_MS = 30_000;

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

export function parseServiceAccountCredentials(rawCredentials) {
  let credentials;

  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error('CWS_SERVICE_ACCOUNT_JSON must contain valid JSON.');
  }

  if (
    credentials?.type !== 'service_account' ||
    typeof credentials.client_email !== 'string' ||
    typeof credentials.private_key !== 'string'
  ) {
    throw new Error(
      'CWS_SERVICE_ACCOUNT_JSON must be a Google service account JSON key.',
    );
  }

  return credentials;
}

export function createServiceAccountAssertion(
  credentials,
  issuedAt = Math.floor(Date.now() / 1_000),
) {
  const header = encodeBase64Url(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
    }),
  );
  const claims = encodeBase64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: CHROME_WEB_STORE_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: issuedAt,
      exp: issuedAt + 3_600,
    }),
  );
  const unsignedAssertion = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedAssertion)
    .end()
    .sign(credentials.private_key)
    .toString('base64url');

  return `${unsignedAssertion}.${signature}`;
}

export function normalizeVersion(version) {
  return version.startsWith('v') ? version.slice(1) : version;
}

export function findExistingVersion(status, expectedVersion) {
  const revisions = [
    ['published', status.publishedItemRevisionStatus],
    ['submitted', status.submittedItemRevisionStatus],
  ];

  for (const [kind, revision] of revisions) {
    const channels = revision?.distributionChannels ?? [];
    if (channels.some((channel) => channel.crxVersion === expectedVersion)) {
      return {
        kind,
        state: revision.state,
      };
    }
  }

  return undefined;
}

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function validateIdentifier(name, value, pattern) {
  if (!pattern.test(value)) {
    throw new Error(`${name} has an invalid format.`);
  }
  return value;
}

function formatApiError(body) {
  const message =
    body?.error?.message ??
    body?.error_description ??
    body?.message ??
    JSON.stringify(body);
  return String(message).slice(0, 2_000);
}

async function readJsonResponse(response, operation) {
  const responseText = await response.text();
  let body = {};

  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(
      `${operation} failed (${response.status}): ${formatApiError(body)}`,
    );
  }

  return body;
}

async function requestAccessToken(credentials) {
  const assertion = createServiceAccountAssertion(credentials);
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await readJsonResponse(response, 'Google authentication');

  if (typeof body.access_token !== 'string') {
    throw new Error('Google authentication did not return an access token.');
  }

  return body.access_token;
}

async function chromeWebStoreRequest(
  url,
  accessToken,
  operation,
  options = {},
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return readJsonResponse(response, operation);
}

function createItemUrls(publisherId, extensionId) {
  const itemName = `publishers/${publisherId}/items/${extensionId}`;

  return {
    status: `${API_ENDPOINT}/v2/${itemName}:fetchStatus`,
    upload: `${API_ENDPOINT}/upload/v2/${itemName}:upload`,
    publish: `${API_ENDPOINT}/v2/${itemName}:publish`,
  };
}

async function fetchStatus(urls, accessToken) {
  return chromeWebStoreRequest(
    urls.status,
    accessToken,
    'Fetching Chrome Web Store status',
  );
}

function isUploadInProgress(state) {
  return state === 'IN_PROGRESS' || state === 'UPLOAD_IN_PROGRESS';
}

async function waitForUpload(urls, accessToken) {
  for (let attempt = 1; attempt <= UPLOAD_POLL_ATTEMPTS; attempt += 1) {
    await new Promise((resolvePromise) => {
      setTimeout(resolvePromise, UPLOAD_POLL_INTERVAL_MS);
    });

    const status = await fetchStatus(urls, accessToken);
    const uploadState = status.lastAsyncUploadState;
    console.log(
      `Chrome Web Store upload status (${attempt}/${UPLOAD_POLL_ATTEMPTS}): ${uploadState ?? 'UNKNOWN'}`,
    );

    if (uploadState === 'SUCCEEDED') {
      return;
    }
    if (uploadState === 'FAILED') {
      throw new Error('Chrome Web Store rejected the uploaded package.');
    }
  }

  throw new Error('Chrome Web Store upload did not finish within 60 seconds.');
}

export function loadConfiguration() {
  const credentials = parseServiceAccountCredentials(
    requireEnvironmentVariable('CWS_SERVICE_ACCOUNT_JSON'),
  );
  const publisherId = validateIdentifier(
    'CWS_PUBLISHER_ID',
    requireEnvironmentVariable('CWS_PUBLISHER_ID'),
    /^[A-Za-z0-9_-]+$/,
  );
  const extensionId = validateIdentifier(
    'CWS_EXTENSION_ID',
    requireEnvironmentVariable('CWS_EXTENSION_ID'),
    /^[a-p]{32}$/,
  );
  const packagePath = resolve(
    requireEnvironmentVariable('CWS_PACKAGE_PATH'),
  );
  const expectedVersion = normalizeVersion(
    requireEnvironmentVariable('CWS_EXPECTED_VERSION'),
  );
  const publishType = process.env.CWS_PUBLISH_TYPE?.trim() || 'DEFAULT_PUBLISH';

  if (!['DEFAULT_PUBLISH', 'STAGED_PUBLISH'].includes(publishType)) {
    throw new Error(
      'CWS_PUBLISH_TYPE must be DEFAULT_PUBLISH or STAGED_PUBLISH.',
    );
  }

  return {
    credentials,
    publisherId,
    extensionId,
    packagePath,
    expectedVersion,
    publishType,
  };
}

export async function publishChromeWebStore(configuration) {
  const {
    credentials,
    publisherId,
    extensionId,
    packagePath,
    expectedVersion,
    publishType,
  } = configuration;
  const urls = createItemUrls(publisherId, extensionId);

  console.log('Authenticating with the Chrome Web Store API...');
  const accessToken = await requestAccessToken(credentials);
  const currentStatus = await fetchStatus(urls, accessToken);
  const existingVersion = findExistingVersion(
    currentStatus,
    expectedVersion,
  );

  if (existingVersion) {
    console.log(
      `Chrome Web Store version ${expectedVersion} is already ${existingVersion.kind} (${existingVersion.state ?? 'state unknown'}).`,
    );
    return;
  }

  const packageContents = await readFile(packagePath);
  console.log(`Uploading Chrome Web Store package for ${expectedVersion}...`);
  const upload = await chromeWebStoreRequest(
    urls.upload,
    accessToken,
    'Uploading Chrome Web Store package',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/zip',
      },
      body: packageContents,
    },
  );

  if (upload.crxVersion && upload.crxVersion !== expectedVersion) {
    throw new Error(
      `Uploaded package version mismatch: expected ${expectedVersion}, received ${upload.crxVersion}.`,
    );
  }
  if (upload.uploadState === 'FAILED') {
    throw new Error('Chrome Web Store rejected the uploaded package.');
  }
  if (isUploadInProgress(upload.uploadState)) {
    await waitForUpload(urls, accessToken);
  } else if (upload.uploadState !== 'SUCCEEDED') {
    throw new Error(
      `Unexpected Chrome Web Store upload state: ${upload.uploadState ?? 'UNKNOWN'}.`,
    );
  }

  console.log(`Submitting ${expectedVersion} for Chrome Web Store review...`);
  const publication = await chromeWebStoreRequest(
    urls.publish,
    accessToken,
    'Submitting Chrome Web Store release',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publishType,
        blockOnWarnings: true,
      }),
    },
  );

  console.log(
    `Chrome Web Store submission accepted: ${publication.state ?? 'state pending'}.`,
  );
}

async function main() {
  const configuration = loadConfiguration();
  await publishChromeWebStore(configuration);
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
