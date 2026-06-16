'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import parse from 'html-react-parser';
import { onEntryChange } from '../contentstack-sdk';
import { getAllEntries, getHeaderRes } from '../helper';
import Skeleton from 'react-loading-skeleton';
import ThemeToggle from './theme-toggle';
import { HeaderProps, Entry, NavLinks } from '../typescript/layout';

export default function Header() {
  const [header, setHeaderProp] = useState<HeaderProps | undefined>(undefined);
  const [entries, setEntries] = useState<Entry | undefined>(undefined);
  const pathname = usePathname();
  const [getHeader, setHeader] = useState(header);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchHeaderAndEntries = async () => {
    try {
      const headerRes = await getHeaderRes();
      const entriesRes = await getAllEntries();
      setHeaderProp(headerRes);
      setEntries(entriesRes);
    } catch (error: unknown) {
      const err = error as { error_message?: string; error_code?: number };
      console.error(
        '[Contentstack] Header load failed:',
        err?.error_message || error,
        err?.error_code ? `(code ${err.error_code})` : '',
      );
    }
  };

  function buildNavigation(ent: Entry, hd: HeaderProps) {
    const newHeader = { ...hd };
    if (ent.length !== newHeader.navigation_menu.length) {
      ent.forEach((entry) => {
        const hFound = newHeader?.navigation_menu.find(
          (navLink: NavLinks) => navLink.label === entry.title,
        );
        if (!hFound) {
          newHeader.navigation_menu?.push({
            label: entry.title,
            page_reference: [{ title: entry.title, url: entry.url, $: entry.$ }],
            $: {},
          });
        }
      });
    }
    return newHeader;
  }

  async function fetchData() {
    try {
      if (header && entries) {
        const headerRes = await getHeaderRes();
        const newHeader = buildNavigation(entries, headerRes);
        setHeader(newHeader);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchHeaderAndEntries();
  }, []);

  useEffect(() => {
    if (header && entries) {
      onEntryChange(() => fetchData());
    }
  }, [header]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('header-menu-open', menuOpen);
    return () => document.body.classList.remove('header-menu-open');
  }, [menuOpen]);

  const headerData = getHeader ? getHeader : header;

  const closeMobileMenu = () => setMenuOpen(false);

  const toggleMobileMenu = () => setMenuOpen((open) => !open);

  return (
    <header className={`header${menuOpen ? ' is-menu-open' : ''}`}>
      {headerData?.notification_bar.show_announcement ? (
        typeof headerData.notification_bar.announcement_text === 'string' && (
          <div className="note-div">
            <div {...(headerData.notification_bar.$?.announcement_text as {})}>
              {parse(headerData.notification_bar.announcement_text)}
            </div>
          </div>
        )
      ) : (
        !headerData && (
          <div className="note-div">
            <Skeleton height={40} borderRadius={0} />
          </div>
        )
      )}

      <div className="max-width header-div">
        <div className="header-bar">
          <div className="wrapper-logo">
            {headerData ? (
              <Link href="/" className="logo-tag" title="Contentstack" onClick={closeMobileMenu}>
                <img
                  className="logo"
                  src={headerData.logo.url}
                  alt={headerData.title}
                  title={headerData.title}
                  {...(headerData.logo.$?.url as {})}
                />
              </Link>
            ) : (
              <Skeleton width={160} height={48} />
            )}
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <button
              type="button"
              className="menu-toggle"
              onClick={toggleMobileMenu}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <span className="menu-toggle__icon" aria-hidden>
                <span className="menu-toggle__line" />
                <span className="menu-toggle__line" />
                <span className="menu-toggle__line" />
              </span>
            </button>
          </div>
        </div>

        <nav
          id="main-navigation"
          className={`menu${menuOpen ? ' is-open' : ''}`}
          aria-label="Main navigation"
        >
          <ul className="nav-ul header-ul">
            {headerData ? (
              headerData.navigation_menu.map((list) => {
                const href = list.page_reference[0].url;
                const isActive = pathname === href;
                return (
                  <li key={list.label} className="nav-li">
                    <Link
                      href={href}
                      className={isActive ? 'active' : ''}
                      onClick={closeMobileMenu}
                      aria-current={isActive ? 'page' : undefined}
                      {...(list.page_reference[0].$?.url as {})}
                    >
                      {list.label}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li className="nav-li nav-li--skeleton">
                <Skeleton width="100%" height={36} />
              </li>
            )}
          </ul>
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="header-backdrop"
          onClick={closeMobileMenu}
          aria-label="Close navigation menu"
        />
      )}
    </header>
  );
}
