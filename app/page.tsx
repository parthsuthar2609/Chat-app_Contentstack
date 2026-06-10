'use client';

import RenderComponents from '@/components/render-components';
import { onEntryChange } from '@/contentstack-sdk';
import { getPageComponentsFromEntry, getPageRes, metaData } from '@/helper';
import { Page } from '@/typescript/pages';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

export default function Home() {
  const entryUrl = usePathname();
  const [entry, setEntry] = useState<Page | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);

  async function fetchData() {
    try {
      setLoadFailed(false);
      const entryRes = await getPageRes(entryUrl);
      if (!entryRes) {
        console.error(
          '[Contentstack] No entry found for',
          entryUrl,
          '(content type: page — check URL field and publish status)',
        );
        setEntry(undefined);
        setLoadFailed(true);
        return;
      }
      setEntry(entryRes);
    } catch (error: unknown) {
      const err = error as { error_message?: string; error_code?: number };
      console.error(
        '[Contentstack] Page load failed:',
        err?.error_message || error,
        err?.error_code ? `(code ${err.error_code})` : '',
      );
      setLoadFailed(true);
    }
  }

  useEffect(() => {
    fetchData();
    onEntryChange(() => fetchData());
  }, [entryUrl]);

  const pageComponents = getPageComponentsFromEntry(entry);

  if (loadFailed) {
    return (
      <div className='max-width' style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', margin: 0 }}>
          Content could not be loaded. Add Contentstack environment variables on Vercel and redeploy.
        </p>
      </div>
    );
  }

  return pageComponents?.length ? (
    <>
      {entry?.seo?.enable_search_indexing && metaData(entry.seo)}
      <RenderComponents
        pageComponents={pageComponents}
        contentTypeUid="page"
        entryUid={entry!.uid}
        locale={entry!.locale}
      />
    </>
  ) : (
    <Skeleton count={3} height={300} />
  );
}
