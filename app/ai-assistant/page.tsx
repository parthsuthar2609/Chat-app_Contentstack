'use client';

import AiAssistant from '@/components/ai-assistant';
import { onEntryChange } from '@/contentstack-sdk';
import { getAiAssistantPageRes, metaData } from '@/helper';
import { AiAssistantData } from '@/typescript/ai-assistant';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useLocale } from '@/hooks/use-locale';

export default function AiAssistantPage() {
  const [data, setData] = useState<AiAssistantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const { locale } = useLocale();

  async function fetchData() {
    try {
      setLoading(true);
      setMissing(false);
      const entry = await getAiAssistantPageRes('/ai-assistant', locale);

      if (!entry) {
        setData(null);
        setMissing(true);
        return;
      }

      setData(entry as AiAssistantData);
    } catch (error: unknown) {
      const err = error as { error_message?: string };
      console.error('[Contentstack] AI Assistant page:', err?.error_message || error);
      setData(null);
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    onEntryChange(() => fetchData());
  }, [locale]);

  if (loading) {
    return (
      <div className='max-width' style={{ padding: '48px 0' }}>
        <Skeleton count={1} height={48} />
        <Skeleton count={3} height={120} style={{ marginTop: 24 }} />
      </div>
    );
  }

  if (missing || !data) {
    notFound();
  }

  return (
    <>
      {data.seo?.enable_search_indexing && metaData(data.seo)}
      <div
        data-pageref={data.uid}
        data-contenttype='page'
        data-locale={data.locale}
      >
        <AiAssistant data={data} />
      </div>
    </>
  );
}
