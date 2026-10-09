# TC-NAV-001-01 home hero and editorial links

Source: Zeouf BRD v1.5 NAV-01/NAV-02, website commit `481a090`. Target: public Zeouf, `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`.

1. On the home page, verify the Women slide is selected and its CTA points to `/women`; switch to Men and verify selected state and `/men` CTA.
2. Pause the hero and verify the control changes to Play. Check six editorial tiles are present.
3. In a separate reduced-motion context, verify video `src` and playback controls are absent while manual slide selection works.
4. Assert no non-read request was attempted.

Automation: `tests/ecommerce/home-hero.spec.ts`. These slices passed on the public deployment on 2026-10-07. Timed rotation, visibility-driven playback, every editorial destination and responsive image behavior remain to be checked.
