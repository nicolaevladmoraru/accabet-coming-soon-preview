/* Basic consent mode: no Google requests until an affirmative choice. */
(() => {
  const id = document.currentScript?.dataset.measurementId;
  if (!/^G-[A-Z0-9]{10}$/.test(id || '') || window.accabetAnalytics) return;
  window.accabetAnalytics = true;
  const key = 'accabet-analytics-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById('analytics-consent');
  let accepted = false;
  let loaded = false;
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && ['accepted', 'rejected'].includes(value.choice) &&
        value.expires > Date.now() && value.expires <= Date.now() + lifetime ? value.choice : null;
    } catch { return null; }
  }
  function clearCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; Path=/`;
      const labels = location.hostname.split('.');
      for (let i = 0; i < labels.length - 1; i++) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${labels.slice(i).join('.')}`;
      }
    }
  }
  function enable() {
    accepted = true;
    if (loaded) return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    // Never send query strings, fragments, form values, user IDs or link URLs.
    window.gtag('config', id, {
      send_page_view: true,
      page_location: location.origin + location.pathname,
      page_referrer: (() => { try { return new URL(document.referrer).origin + '/'; } catch { return ''; } })(),
      page_title: document.title,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
      cookie_update: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  function choose(choice) {
    try { localStorage.setItem(key, JSON.stringify({ choice, expires: Date.now() + lifetime })); } catch { /* Session-only consent when storage is unavailable. */ }
    banner.hidden = true;
    if (choice === 'accepted') enable();
    else {
      accepted = false;
      window['ga-disable-' + id] = true;
      clearCookies();
      // Unload the tag so engagement collection stops immediately after withdrawal.
      if (loaded) location.reload();
    }
  }
  document.querySelectorAll('[data-analytics-choice]').forEach(button => {
    button.addEventListener('click', () => choose(button.dataset.analyticsChoice));
  });
  document.getElementById('analytics-settings').addEventListener('click', () => {
    banner.hidden = false;
    banner.querySelector('button').focus();
  });
  document.addEventListener('click', event => {
    if (!accepted || read() === 'rejected') return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const official = {
      'https://www.instagram.com/accabet.official/': 'instagram',
      'https://www.facebook.com/profile.php?id=1327395387132747': 'facebook',
      'https://www.youtube.com/@AccaBetOfficial': 'youtube'
    };
    const platform = official[link.href];
    if (platform) window.gtag('event', 'social_click', { social_platform: platform });
  });
  window.addEventListener('storage', event => {
    if (event.key === key && read() !== 'accepted') {
      accepted = false;
      window['ga-disable-' + id] = true;
      clearCookies();
      if (loaded) location.reload();
      else banner.hidden = read() === 'rejected';
    }
  });
  const choice = read();
  if (choice === 'accepted') enable();
  else { clearCookies(); banner.hidden = choice === 'rejected'; }
})();
