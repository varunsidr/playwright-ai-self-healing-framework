# TC-CNT-02-CORE and TC-CNT-03-CORE footer and demo content

Source: Zeouf BRD v1.5 CNT-02/CNT-03, website commit `481a090`. Target: public Zeouf, `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`.

1. Check footer hrefs for seven categories, Favorites, Privacy and Terms. Check the GitHub link opens a new tab with `noopener noreferrer`.
2. Follow Privacy and Terms footer links, verify each page and its return-home link, then return home. Category link targets are checked as hrefs only.
3. Read current home, signed-out checkout, privacy and terms copy for demo simulation, no charge, no shipment and fictional data statements. Do not submit checkout.
4. Assert no non-read request was attempted.

Automation: `tests/ecommerce/footer-content.spec.ts`. Public baseline passed on 2026-10-07. CNT-03 remains partial: BRD gap G-22 records generic shipping/returns and confirmation copy conflicts that need owner review and website changes.
