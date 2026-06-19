/**
 * Music Splitter — Header Component
 */

import './Header.css';

export default function Header() {
  return (
    <header className="header" id="header">
      <div className="header__inner container">
        <div className="header__brand">
          <svg className="header__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="header__title">Music Splitter</span>
        </div>
        <div className="header__meta">
          <span className="badge-pill">DEMUCS V4</span>
          <span className="badge-pill">AI POWERED</span>
        </div>
      </div>
    </header>
  );
}
