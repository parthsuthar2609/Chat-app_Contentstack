'use client';

import GalleryReact from '@/components/gallery';
import HeroBanner from '@/components/hero-banner';
import { onEntryChange } from '@/contentstack-sdk';
import { getComposableHeroGallery, metaData } from '@/helper';
import { Banner } from '@/typescript/component';
import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

type SuperHeroGalleryBlock = {
  heading?: string;
  description?: string;
  heroes?: unknown[];
  $?: {
    heading?: Record<string, unknown>;
    description?: Record<string, unknown>;
  };
};

type GalleryModularBlock = {
  hero_banner?: Banner;
  super_heroes_gallery?: SuperHeroGalleryBlock;
};

type GalleryEntry = {
  uid: string;
  locale: string;
  seo?: { enable_search_indexing?: boolean };
  modular_blocks?: GalleryModularBlock[];
};

function renderTemplateSection(
  blockKey: string,
  modules: GalleryModularBlock,
  index: number,
) {
  switch (blockKey) {
    case 'hero_banner':
      return modules.hero_banner ? (
        <HeroBanner
          banner={modules.hero_banner}
          key={`herobanner-${index}`}
        />
      ) : null;
    case 'super_heroes_gallery': {
      const superHeroGallery = modules.super_heroes_gallery;
      return (
        <GalleryReact
          data={superHeroGallery?.heroes}
          heading={superHeroGallery?.heading}
          headingTags={superHeroGallery?.$?.heading}
          description={superHeroGallery?.description}
          descriptionTags={superHeroGallery?.$?.description}
          showFilter
          showDescription={false}
          key={`gallery-${index}`}
        />
      );
    }
    default:
      return null;
  }
}

type FetchStatus = 'loading' | 'found' | 'missing';

export default function SuperHerosGallery() {
    const entryUrl = usePathname();
    const [gallery, setGallery] = useState<GalleryEntry | undefined>();
    const [status, setStatus] = useState<FetchStatus>('loading');

    async function fetchData() {
        try {
            setStatus('loading');
            const galleryRes = await getComposableHeroGallery(entryUrl);
            if (!galleryRes) {
                setGallery(undefined);
                setStatus('missing');
                return;
            }
            setGallery(galleryRes);
            setStatus('found');
        } catch (error: unknown) {
            const err = error as { error_message?: string; error_code?: number };
            console.error(
                '[Contentstack] Gallery load failed:',
                err?.error_message || error,
                err?.error_code ? `(code ${err.error_code})` : '',
            );
            setStatus('missing');
        }
    }

    useEffect(() => {
        fetchData();
        onEntryChange(() => fetchData());
    }, [entryUrl]);

    if (status === 'missing') {
        notFound();
    }

    if (status === 'loading' || !gallery?.modular_blocks?.length) {
        return <Skeleton count={3} height={300} />;
    }

    return (
    <>
      {gallery.seo?.enable_search_indexing && metaData(gallery.seo)}
      <div
        data-pageref={gallery.uid}
        data-contenttype="superhero_landing_page"
        data-locale={gallery.locale}
      >
        {gallery.modular_blocks.map((block, index) => {
          const blockKey = Object.keys(block)[0];
          return renderTemplateSection(blockKey, block, index);
        })}
            </div>
        </>
    );
}
