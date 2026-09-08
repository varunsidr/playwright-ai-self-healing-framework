// Custom test/expect wrapper (Selenium equivalent: a shared base test class).
// Every spec must import { test, expect } from here instead of '@playwright/test'
// so the page-object/flow fixtures below are always available.
import { test as base } from '@playwright/test';
import { InputsPage, HomePage, RegisterPage } from '../pages/practice-site-pages';
import { InputsFlow, HomeFlow, RegisterFlow } from '../flows/practice-site-flows';

// Site under test embeds third-party ad/analytics iframes that slow down and
// occasionally destabilize locators -- abort these requests at the network level.
// This list only covers known ad-serving domains; it can't catch every ad
// network, so some ad creatives may still render (see ARCHITECTURE.md notes).
const BLOCKED_AD_DOMAINS = [
  '**://*.googlesyndication.com/**',
  '**://*.doubleclick.net/**',
  '**://*.google-analytics.com/**',
  '**://*.googletagmanager.com/**',
  '**://*.googleadservices.com/**',
  '**://*.adsafeprotected.com/**',
  '**://*.amazon-adsystem.com/**',
  '**://*.criteo.com/**',
  '**://*.taboola.com/**',
  '**://*.outbrain.com/**',
  '**://*.adnxs.com/**',
  '**://*.rubiconproject.com/**',
  '**://*.pubmatic.com/**',
  '**://*.casalemedia.com/**',
  '**://*.contextweb.com/**',
  '**://*.smartadserver.com/**',
  '**://*.media.net/**',
  '**://*.moatads.com/**',
  '**://*.scorecardresearch.com/**',
  '**://*.quantserve.com/**',
  '**://*.adsrvr.org/**',
  '**://*.adform.net/**',
  '**://*.yieldmo.com/**',
  '**://*.sharethrough.com/**',
  '**://*.indexexchange.com/**',
  '**://*.openx.net/**',
  '**://*.sovrn.com/**',
  '**://*.3lift.com/**',
  '**://*.rlcdn.com/**',
  '**://*.bidswitch.net/**',
  '**://*.mgid.com/**',
  '**://*.connatix.com/**',
  '**://*.pagead2.googlesyndication.com/**',
  '**://*.adservice.google.com/**',
  '**://*.ads.google.com/**',
  '**://*.securepubads.g.doubleclick.net/**',
  '**://*.static.doubleclick.net/**',
  '**://*.doubleverify.com/**',
  '**://*.adroll.com/**',
  '**://*.connect.facebook.net/**',
  '**://*.pixel.facebook.com/**',
  '**://*.static.ads-twitter.com/**',
  '**://*.ads-twitter.com/**',
  '**://*.adition.com/**',
];

export const test = base.extend<{
  inputsPage: InputsPage;
  inputsFlow: InputsFlow;
  homePage: HomePage;
  homeFlow: HomeFlow;
  registerPage: RegisterPage;
  registerFlow: RegisterFlow;
  blockAds: void;
}>({
  // Runs before every test (auto: true) with no explicit fixture argument needed in specs.
  blockAds: [
    async ({ page }, use) => {
      await Promise.all(BLOCKED_AD_DOMAINS.map((pattern) => page.route(pattern, (route) => route.abort())));
      await use();
    },
    { auto: true },
  ],

  // Each fixture below auto-instantiates one page object/flow per test using
  // the built-in `page` object, then injects it as a named test argument.
  inputsPage: async ({ page }, use) => {
    await use(new InputsPage(page));
  },

  inputsFlow: async ({ inputsPage }, use) => {
    await use(new InputsFlow(inputsPage));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  homeFlow: async ({ homePage }, use) => {
    await use(new HomeFlow(homePage));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  registerFlow: async ({ homePage, registerPage }, use) => {
    await use(new RegisterFlow(homePage, registerPage));
  },
});

export { expect } from '@playwright/test';
