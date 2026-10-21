import type { ConsoleMessage, Frame, Page, Request, Response } from '@playwright/test';

/** Observe requests without intercepting them or changing navigation timing. */
export function captureEcommerceNavigation(page: Page) {
  const started = Date.now();
  const elapsed = () => Date.now() - started;
  const safeUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.origin + url.pathname + (url.search ? '?[query omitted]' : '');
    } catch {
      return value;
    }
  };
  type Read = {
    url: string;
    resourceType: string;
    navigation: boolean;
    rsc: boolean;
    prefetch: boolean;
    startedMs: number;
    state: 'pending' | 'finished' | 'failed';
    status?: number;
    endedMs?: number;
    failure?: string;
  };
  const reads: Read[] = [];
  const active = new Map<Request, Read>();
  const events: { atMs: number; type: string; message: string }[] = [];
  let omittedRequests = 0;
  let omittedEvents = 0;
  const event = (type: string, message: string) => {
    if (events.length < 200)
      events.push({ atMs: elapsed(), type, message: message.slice(0, 2000) });
    else omittedEvents++;
  };
  const requested = (request: Request) => {
    if (!['document', 'fetch', 'xhr', 'script'].includes(request.resourceType())) return;
    if (reads.length >= 500) {
      omittedRequests++;
      return;
    }
    const headers = request.headers();
    const read: Read = {
      url: safeUrl(request.url()),
      resourceType: request.resourceType(),
      navigation: request.isNavigationRequest(),
      rsc: headers.rsc === '1',
      prefetch: headers['next-router-prefetch'] === '1',
      startedMs: elapsed(),
      state: 'pending',
    };
    reads.push(read);
    active.set(request, read);
  };
  const responded = (response: Response) => {
    const read = active.get(response.request());
    if (read) read.status = response.status();
  };
  const finished = (request: Request) => {
    const read = active.get(request);
    if (read) {
      read.state = 'finished';
      read.endedMs = elapsed();
    }
    active.delete(request);
  };
  const failed = (request: Request) => {
    const read = active.get(request);
    if (read) {
      read.state = 'failed';
      read.endedMs = elapsed();
      read.failure = request.failure()?.errorText;
    }
    event('requestfailed', `${safeUrl(request.url())}: ${request.failure()?.errorText}`);
    active.delete(request);
  };
  const pageError = (error: Error) => event('pageerror', error.message);
  const consoleError = (message: ConsoleMessage) => {
    if (message.type() === 'error') event('console-error', message.text());
  };
  const navigated = (frame: Frame) => {
    if (frame === page.mainFrame()) event('main-frame-url', safeUrl(frame.url()));
  };
  page.on('request', requested);
  page.on('response', responded);
  page.on('requestfinished', finished);
  page.on('requestfailed', failed);
  page.on('pageerror', pageError);
  page.on('console', consoleError);
  page.on('framenavigated', navigated);
  return {
    snapshot: () => ({
      finalUrl: safeUrl(page.url()),
      elapsedMs: elapsed(),
      requests: reads,
      events,
      omittedRequests,
      omittedEvents,
    }),
    stop: () => {
      page.off('request', requested);
      page.off('response', responded);
      page.off('requestfinished', finished);
      page.off('requestfailed', failed);
      page.off('pageerror', pageError);
      page.off('console', consoleError);
      page.off('framenavigated', navigated);
    },
  };
}
