'use client';

import Link from 'next/link';
import { SearchResultItem } from '@/typescript/ai-assistant';

type SuggestedArticlesProps = {
  articles: SearchResultItem[];
  readArticleText?: string;
  onAskAbout?: (title: string) => void;
};

export default function SuggestedArticles({
  articles,
  readArticleText = 'Read article',
  onAskAbout,
}: SuggestedArticlesProps) {
  if (!articles.length) return null;

  return (
    <div className='ai-assistant__suggested-articles'>
      <p className='ai-assistant__suggested-articles-label'>
        <i className='fa-solid fa-newspaper' aria-hidden /> Suggested articles
      </p>
      <ul className='ai-assistant__suggested-articles-list'>
        {articles.map((article, index) => (
          <li
            key={article.uid}
            className='ai-assistant__suggested-article ai-assistant__fade-rise'
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <Link href={article.url} className='ai-assistant__suggested-article-title'>
              {article.title}
            </Link>
            {article.excerpt && (
              <p className='ai-assistant__suggested-article-excerpt'>{article.excerpt}…</p>
            )}
            <div className='ai-assistant__suggested-article-actions'>
              <Link href={article.url} className='ai-assistant__suggested-article-link'>
                {readArticleText} <i className='fa-solid fa-arrow-right' aria-hidden />
              </Link>
              {onAskAbout && (
                <button
                  type='button'
                  className='ai-assistant__suggested-article-ask'
                  onClick={() => onAskAbout(article.title)}
                >
                  <i className='fa-solid fa-comment-dots' aria-hidden /> Ask about this
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
