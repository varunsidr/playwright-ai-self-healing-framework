# Playwright API Blueprint Insights

## Core lessons from the blueprint

1. Separate transport/config from domain clients.

   - `runtime-config` should resolve env at runtime, not freeze values at module import.
   - the transport layer should own auth headers, base URL assembly, and request retry behavior.
2. Keep two client contracts over the same endpoints.

   - A strict client throws on failure and is used for seeding and real workflow setup.
   - A raw client returns status/body/text and is used for negative contract tests.
3. Resource-specific clients are better than one giant utility file.

   - create one helper family for notes, users, or auth rather than scattering route logic across specs.
4. Cache state intentionally.

   - Keep `.auth/<env>/<prefix>/...` files for seeded users and known data records.
   - Invalidate stale tokens and expired records automatically.
5. Negative API tests are as important as happy-path tests.

   - Missing auth must return 401.
   - Invalid payloads must return 400 with a meaningful message.
   - Structural assertions should validate the contract, not just status codes.
6. Tags matter for CI.

   - Using a dedicated `api` project and `@api` style tagging makes the suite runnable independently of browser-heavy tests.

## Practical fit for this repo

This project already reflects several blueprint ideas well:

- lazy environment resolution in `utils/runtime-config.ts`
- shared state caching in `utils/api-state-cache.ts`
- strict/raw API separation in `fixtures/api-fixtures.ts`
- token refresh logic for seeded users

The remaining gap is resource-specific client helpers and explicit contract coverage for invalid payloads and missing auth, which is where the blueprint adds the most leverage.
