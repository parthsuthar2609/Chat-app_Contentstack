import React from 'react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { Action, Image } from '../typescript/action';

type AdditionalParam = {
  title?: string;
  description?: string;
};

type CtaField = Action & { url?: string };

type IconCardItem = {
  title?: string;
  description?: string;
  icon?: Image;
  icon_image?: Image;
  call_to_action?: CtaField;
  action_cta?: CtaField;
  cta?: CtaField;
  $?: AdditionalParam;
};

export type IconCardsData = {
  title?: string;
  description?: string;
  icon_cards?: IconCardItem[];
  icon_card?: IconCardItem | IconCardItem[];
  $?: AdditionalParam;
};

type IconCardsProps = {
  data: IconCardsData;
};

function normalizeCards(data: IconCardsData): IconCardItem[] {
  const raw = data?.icon_cards ?? data?.icon_card;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function getIconUrl(card: IconCardItem) {
  return card?.icon_image?.url || card?.icon?.url;
}

function getIconMeta(card: IconCardItem) {
  return card?.icon_image || card?.icon;
}

function getCardCta(card: IconCardItem): CtaField | undefined {
  return card.call_to_action || card.action_cta || card.cta;
}

function getCtaHref(cta?: CtaField) {
  if (!cta) return undefined;
  return cta.href || cta.url;
}

export default function IconCards({ data }: IconCardsProps) {
  const cards = normalizeCards(data);
  const hasHeader = Boolean(data?.title || data?.description);

  return (
    <section className='icon-cards-section'>
      <div className='max-width icon-cards-section__container'>
      {hasHeader && (
        <div className='icon-cards-section__header'>
          {data?.title && (
            <h2 className='icon-cards-section__title' {...(data.$?.title as {})}>
              {data.title}
            </h2>
          )}
          {data?.description && (
            <div
              className='icon-cards-section__description'
              {...(data.$?.description as {})}
            >
              {typeof data.description === 'string'
                ? parse(data.description)
                : data.description}
            </div>
          )}
        </div>
      )}
      {cards.length > 0 && (
        <ul className='icon-cards-grid'>
          {cards.map((card, index) => {
            const icon = getIconMeta(card);
            const iconUrl = getIconUrl(card);
            const cta = getCardCta(card);
            const ctaHref = getCtaHref(cta);
            return (
              <li className='icon-cards-grid__item' key={index}>
                <article className='icon-cards-card'>
                  {iconUrl && (
                    <div className='icon-cards-card__icon-wrap'>
                      <img
                        src={iconUrl}
                        alt={icon?.filename || card.title || 'Icon'}
                        className='icon-cards-card__icon'
                        {...(icon?.$?.url as {})}
                      />
                    </div>
                  )}
                  <div className='icon-cards-card__body'>
                    {card.title && (
                      <h3 className='icon-cards-card__title' {...(card.$?.title as {})}>
                        {card.title}
                      </h3>
                    )}
                    {card.description && (
                      <p className='icon-cards-card__text' {...(card.$?.description as {})}>
                        {typeof card.description === 'string'
                          ? parse(card.description)
                          : card.description}
                      </p>
                    )}
                  </div>
                  {cta?.title && ctaHref && (
                    <div className='icon-cards-card__cta'>
                      <Link
                        href={ctaHref}
                        className='btn primary-btn'
                        {...(cta.$?.title as {})}
                      >
                        {cta.title}
                      </Link>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </section>
  );
}
