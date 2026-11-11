/** Additional browser projects share guards, while canonical BRD evidence keeps its original project. */
export function isEcommerceBrowserProject(name: string): boolean {
  return [
    'ecommerce-chromium',
    'ecommerce-firefox',
    'ecommerce-webkit',
    'ecommerce-mobile-chromium',
  ].includes(name);
}
