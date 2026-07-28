const canValidateUrl = (pageUrl: string) => {
  try {
    const url = new URL(pageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export function buildGoogleRichResultsUrl(pageUrl: string) {
  const base = 'https://search.google.com/test/rich-results';
  if (!canValidateUrl(pageUrl)) return base;
  const url = new URL(base);
  url.searchParams.set('url', pageUrl);
  return url.toString();
}

export function buildSchemaValidatorUrl(pageUrl: string) {
  const base = 'https://validator.schema.org/';
  if (!canValidateUrl(pageUrl)) return base;
  return `${base}#url=${encodeURIComponent(pageUrl)}`;
}

export function isExternallyValidatableUrl(pageUrl: string) {
  return canValidateUrl(pageUrl);
}
