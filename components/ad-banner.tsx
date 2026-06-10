import React from 'react';
import Link from 'next/link';
import { Action, Image } from '../typescript/action';

type AdditionalParam = {
  banner_title: string;
  banner_description: string;
};

export type AdBannerData = {
  banner_title: string;
  banner_description: string;
  background_image: Image;
  call_to_action: Action;
  text_color?: string;
  $?: AdditionalParam;
};

type AdBannerProps = {
  banner: AdBannerData;
};

export default function AdBanner({ banner }: AdBannerProps) {
  const textColor = banner?.text_color || '#ffffff';
  const bgUrl = banner?.background_image?.url;

  return (
    <section
      className='ad-banner'
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        color: textColor,
      }}
    >
      <div className='ad-banner__overlay' />
      <div className='ad-banner__content max-width'>
        {banner.banner_title && (
          <h2 className='ad-banner__title' {...banner.$?.banner_title as {}}>
            {banner.banner_title}
          </h2>
        )}
        {banner.banner_description && (
          <p className='ad-banner__description' {...banner.$?.banner_description as {}}>
            {banner.banner_description}
          </p>
        )}
        {banner.call_to_action?.title && banner.call_to_action?.href && (
          <Link
            href={banner.call_to_action.href}
            className='btn tertiary-btn ad-banner__cta'
            {...banner.call_to_action.$?.title as {}}
          >
            {banner.call_to_action.title}
          </Link>
        )}
      </div>
    </section>
  );
}
