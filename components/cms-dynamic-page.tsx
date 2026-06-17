'use client';

import RenderComponents from '@/components/render-components';
import { onEntryChange } from '@/contentstack-sdk';
import {
    getPageComponentsFromEntry,
    getPageRes,
    getServicesPageRes,
    metaData,
} from '@/helper';
import { Page as PageProp } from '@/typescript/pages';
import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useLocale } from '@/hooks/use-locale';

type FetchStatus = 'loading' | 'found' | 'missing';

async function fetchCmsEntry(entryUrl: string, locale?: string) {
    return (await getPageRes(entryUrl, locale)) || (await getServicesPageRes(entryUrl, locale));
}

export default function CmsDynamicPage() {
    const entryUrl = usePathname();
    const { locale } = useLocale();
    const [entry, setEntry] = useState<PageProp>();
    const [status, setStatus] = useState<FetchStatus>('loading');

    async function fetchData() {
        try {
            setStatus('loading');
            const entryRes = await fetchCmsEntry(entryUrl, locale);

            if (!entryRes) {
                setEntry(undefined);
                setStatus('missing');
                return;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('[CMS Entry]', entryRes);
                console.log('[CMS Blocks]', getPageComponentsFromEntry(entryRes));
            }

            setEntry(entryRes);
            setStatus('found');
        } catch (error: unknown) {
            const err = error as { error_message?: string; error_code?: number };
            console.error(
                '[Contentstack] Page load failed:',
                err?.error_message || error,
                err?.error_code ? `(code ${err.error_code})` : '',
            );
            setStatus('missing');
        }
    }

    useEffect(() => {
        fetchData();
        onEntryChange(() => fetchData());
    }, [entryUrl, locale]);

    if (status === 'missing') {
        notFound();
    }

    if (status === 'loading' || !entry) {
        return <Skeleton count={3} height={300} />;
    }

    const pageComponents = getPageComponentsFromEntry(entry);
    const contentTypeUid = entry.page_components ? 'page' : 'services';

    if (!pageComponents?.length) {
        return <Skeleton count={3} height={300} />;
    }

    return (
        <>
            {entry.seo?.enable_search_indexing && metaData(entry.seo)}
            <RenderComponents
                pageComponents={pageComponents}
                contentTypeUid={contentTypeUid}
                entryUid={entry.uid}
                locale={entry.locale}
            />
        </>
    );
}
