/**
 * Music Splitter — Footer Component
 */

import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <svg className="footer__icon" viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Music Splitter</span>
        </div>
        <p className="footer__copy">
          Powered by <a href="https://github.com/facebookresearch/demucs" target="_blank" rel="noopener noreferrer" className="footer__link">Demucs v4</a> by Meta Research.
          Open-source AI music separation.
        </p>
      </div>
    </footer>
  );
}
