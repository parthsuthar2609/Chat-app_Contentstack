import * as contentstack from 'contentstack';
import * as Utils from '@contentstack/utils';
import ContentstackLivePreview from '@contentstack/live-preview-utils';

const livePreviewEnabled = process.env.CONTENTSTACK_LIVE_PREVIEW !== 'false';

// Initialize Stack
const Stack = contentstack.Stack({
  api_key: process.env.CONTENTSTACK_API_KEY
    ? process.env.CONTENTSTACK_API_KEY
    : process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
  delivery_token: process.env.CONTENTSTACK_DELIVERY_TOKEN,
  environment: process.env.CONTENTSTACK_ENVIRONMENT,
  region: process.env.CONTENTSTACK_REGION ? process.env.CONTENTSTACK_REGION : 'us',
  live_preview: {
    enable: livePreviewEnabled,
    host: process.env.CONTENTSTACK_PREVIEW_HOST,
    preview_token: process.env.CONTENTSTACK_PREVIEW_TOKEN
  },
});

if (process.env.CONTENTSTACK_API_HOST) {
  Stack.setHost(process.env.CONTENTSTACK_API_HOST);
}

// Initialize Live Preview SDK in the browser only (required for Next.js)
if (typeof window !== 'undefined' && livePreviewEnabled) {
  ContentstackLivePreview.init({
    stackSdk: Stack,
    stackDetails: {
      apiKey:
        process.env.CONTENTSTACK_API_KEY
        || process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
      environment: process.env.CONTENTSTACK_ENVIRONMENT,
      branch: process.env.CONTENTSTACK_BRANCH || 'main',
    },
    clientUrlParams: {
      protocol: 'https',
      port: 443,
      host: process.env.CONTENTSTACK_APP_HOST,
    },
    enable: true,
    ssr: false,
    mode: 'preview',
    editButton: { enable: true },
  });
}

export const onEntryChange = ContentstackLivePreview.onEntryChange;
export const onLiveEdit = ContentstackLivePreview.onLiveEdit;

const renderOption = {
  span: (node, next) => next(node.children),
};

const logContentstackError = (action, error, context = {}) => {
  const message = error?.error_message || error?.message || String(error);
  const code = error?.error_code;
  console.error(
    `[Contentstack] ${action} failed:`,
    message,
    code ? `(code ${code})` : '',
    context,
  );
};

export default {
  /**
   *
   * fetches all the entries from specific content-type
   * @param {* content-type uid} contentTypeUid
   * @param {* reference field name} referenceFieldPath
   * @param {* Json RTE path} jsonRtePath
   *
   */
  getEntry({ contentTypeUid, referenceFieldPath, jsonRtePath }) {
    return new Promise((resolve, reject) => {
      const query = Stack.ContentType(contentTypeUid).Query();
      if (referenceFieldPath) query.includeReference(referenceFieldPath);
      query
        .toJSON()
        .find()
        .then(
          (result) => {
            jsonRtePath
              && Utils.jsonToHTML({
                entry: result,
                paths: jsonRtePath,
                renderOption,
              });
            resolve(result);
          },
          (error) => {
            reject(error);
          },
        );
    });
  },

  /**
   *fetches specific entry from a content-type
   *
   * @param {* content-type uid} contentTypeUid
   * @param {* url for entry to be fetched} entryUrl
   * @param {* reference field name} referenceFieldPath
   * @param {* Json RTE path} jsonRtePath
   * @returns
   */
  getEntryByUrl({
    contentTypeUid, entryUrl, referenceFieldPath, jsonRtePath, urlField = 'url',
  }) {
    return new Promise((resolve, reject) => {
      const blogQuery = Stack.ContentType(contentTypeUid).Query();
      if (referenceFieldPath?.length) blogQuery.includeReference(referenceFieldPath);
      blogQuery.toJSON();
      const data = blogQuery.where(urlField, `${entryUrl}`)?.find();
      data?.then(
        (result) => {
          jsonRtePath
          && Utils.jsonToHTML({
            entry: result,
            paths: jsonRtePath,
            renderOption,
          });
          const entries = result?.[0];
          const entry = Array.isArray(entries) && entries.length > 0 ? entries[0] : null;
          resolve(entry);
        },
        (error) => {
          logContentstackError('getEntryByUrl', error, {
            contentTypeUid,
            entryUrl,
            urlField,
          });
          reject(error);
        },
      ).catch((err) => {
        logContentstackError('getEntryByUrl', err, {
          contentTypeUid,
          entryUrl,
          urlField,
        });
        reject(err);
      });
    });
  },
};
