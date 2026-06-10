'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import parse from 'html-react-parser';
import { onEntryChange } from '../contentstack-sdk';
import { getAllEntries, getHeaderRes } from '../helper';
import Skeleton from 'react-loading-skeleton';
import { HeaderProps, Entry, NavLinks } from "../typescript/layout";

export default function Header() {
  const [header, setHeaderProp] = useState<HeaderProps | undefined>(undefined);
  const [entries, setEntries] = useState<Entry | undefined>(undefined);
  const pathname = usePathname();
  const [getHeader, setHeader] = useState(header);
  const menuRef = useRef<HTMLInputElement>(null);

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
          (navLink: NavLinks) => navLink.label === entry.title
        );
        if (!hFound) {
          newHeader.navigation_menu?.push({
            label: entry.title,
            page_reference: [
              { title: entry.title, url: entry.url, $: entry.$ },
            ],
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
    if (menuRef.current) {
      menuRef.current.checked = false;
    }
  }, [pathname]);

  const headerData = getHeader ? getHeader : header;

  const closeMobileMenu = () => {
    if (menuRef.current) {
      menuRef.current.checked = false;
    }
  };

  return (
    <header className="header">
      {headerData?.notification_bar.show_announcement ? (
        typeof headerData.notification_bar.announcement_text === 'string' && (
          <div className="note-div">
            <div {...headerData.notification_bar.$?.announcement_text as {}}>
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
        <div className="wrapper-logo">
          {headerData ? (
            <Link href="/" className="logo-tag" title="Contentstack" onClick={closeMobileMenu}>
              <img
                className="logo"
                src={headerData.logo.url}
                alt={headerData.title}
                title={headerData.title}
                {...headerData.logo.$?.url as {}}
              />
            </Link>
          ) : (
            <Skeleton width={220} height={80} />
          )}
        </div>

        <input
          ref={menuRef}
          className="menu-btn"
          type="checkbox"
          id="menu-btn"
          aria-label="Toggle navigation menu"
        />
        <label className="menu-icon" htmlFor="menu-btn" aria-hidden="true">
          <span className="navicon" />
        </label>

        <nav className="menu" aria-label="Main navigation">
          <ul className="nav-ul header-ul">
            {headerData ? (
              headerData.navigation_menu.map((list) => {
                const href = list.page_reference[0].url;
                const isActive = pathname === href;
                return (
                  <li
                    key={list.label}
                    className="nav-li"
                    {...list.page_reference[0].$?.url as {}}
                  >
                    <Link
                      href={href}
                      className={isActive ? 'active' : ''}
                      onClick={closeMobileMenu}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {list.label}
                    </Link>
                  </li>
                );
              })
            ) : (
              <Skeleton width={300} height={36} />
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
