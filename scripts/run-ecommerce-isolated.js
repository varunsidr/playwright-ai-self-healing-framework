'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const runtime = require('./ecommerce-repair/runtime');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');
const root = path.resolve(__dirname, '..');

async function main(args = process.argv.slice(2)) {
  const [websiteArgument, outputArgument] = args;
  if (!websiteArgument || !outputArgument || args.length !== 2)
    throw new Error(
      'Usage: test:ecommerce:isolated -- <clean-Zeouf-checkout> <new-evidence-directory>',
    );
  const source = path.resolve(websiteArgument);
  const output = path.resolve(outputArgument);
  if (fs.existsSync(output))
    throw new Error('Use a new evidence directory; previous results are retained.');
  const revision = runtime.command('git', ['rev-parse', 'HEAD'], source);
  if (runtime.command('git', ['status', '--porcelain', '--untracked-files=no'], source))
    throw new Error('The Zeouf source checkout must be clean.');
  fs.mkdirSync(output, { recursive: true });
  // Next's generated filenames exceed Windows MAX_PATH under a long repository path.
  const website = path.join(runtime.makeWorkspace(), 'website');
  const result = {
    schemaVersion: 1,
    status: 'preparing',
    websiteRevision: revision,
    websiteWorkspace: website,
    environment: 'isolated-browser-fixture',
  };
  let server;
  try {
    runtime.command('git', ['clone', '--quiet', '--no-hardlinks', source, website], root);
    runtime.command('git', ['checkout', '--quiet', '--detach', revision], website);
    // A copied .env could override placeholder configuration. Refuse it before installing or building.
    const envFiles = fs
      .readdirSync(website)
      .filter((file) => /^\.env(?:\.|$)/.test(file) && file !== '.env.example');
    if (envFiles.length) throw new Error('Isolated checkout contains environment files.');
    const { allProducts } = require(path.join(website, 'scripts/products-data.js'));
    const products = allProducts.map((product, index) => ({
      ...product,
      id: String(product.id ?? index + 1),
    }));
    const selected = {
      sized: products.find((product) => product.name === 'Brown Twist Blouse'),
      soldOut: products.find(
        (product) => product.image_url === '/demo-products/womens-dress/05.jpg',
      ),
      unsized: products.find(
        (product) =>
          product.category?.startsWith("Women's") &&
          !product.sizes?.length &&
          Number(product.stock) > 0,
      ),
    };
    if (Object.values(selected).some((product) => !product))
      throw new Error('Website revision lacks the reviewed fixture products.');
    const productsFile = path.join(output, 'products.json');
    fs.writeFileSync(productsFile, JSON.stringify(selected, null, 2) + '\n');
    await runtime.install(website, output, 'website');
    await runtime.buildWebsite(website, output, 'website');
    server = await runtime.startWebsite(website, output, 'website');
    const reportFile = path.join(output, 'results.json');
    const inputs = [
      'playwright.config.ts',
      'fixtures/ecommerce-base.ts',
      'fixtures/ecommerce-isolated.ts',
      'fixtures/ecommerce-isolated-admin.ts',
      'pages/ecommerce-storefront-page.ts',
      'specs/ecommerce/requirements/case-catalog.json',
      'specs/ecommerce/requirements/check-links.json',
      ...fs
        .readdirSync(path.join(root, 'tests/ecommerce/isolated'))
        .map((file) => 'tests/ecommerce/isolated/' + file),
    ];
    const inputHashes = () =>
      Object.fromEntries(
        inputs.map((file) => [
          file,
          createHash('sha256')
            .update(fs.readFileSync(path.join(root, file)))
            .digest('hex'),
        ]),
      );
    const before = inputHashes();
    fs.writeFileSync(
      path.join(output, 'framework-inputs.json'),
      JSON.stringify(before, null, 2) + '\n',
    );
    const run = await runtime.run(
      process.execPath,
      [
        path.join(root, 'node_modules/@playwright/test/cli.js'),
        'test',
        'tests/ecommerce/isolated',
        '--project=ecommerce-chromium',
        '--workers=1',
        '--retries=0',
      ],
      root,
      path.join(output, 'browser.log'),
      {
        env: {
          ...runtime.cleanEnvironment(),
          ECOMMERCE_BASE_URL: server.url,
          ECOMMERCE_ISOLATED_FIXTURES: 'true',
          ECOMMERCE_ISOLATED_PRODUCTS_FILE: productsFile,
          ECOMMERCE_BUILD_REVISION: revision,
          ECOMMERCE_STAGING_CONFIRMED: 'false',
          PW_OUTPUT_DIR: path.join(output, 'artifacts'),
          PW_JSON_REPORT_PATH: reportFile,
          PW_JUNIT_REPORT_PATH: path.join(output, 'junit.xml'),
          PW_HTML_REPORT_DIR: path.join(output, 'html'),
          PW_ALLURE_RESULTS_DIR: path.join(output, 'allure'),
        },
      },
    );
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    if (JSON.stringify(before) !== JSON.stringify(inputHashes()))
      throw new Error('Framework inputs changed during isolated browser execution.');
    result.frameworkInputsUnchanged = true;
    result.reportSha256 = createHash('sha256').update(fs.readFileSync(reportFile)).digest('hex');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, 'specs/ecommerce/requirements/check-links.json'), 'utf8'),
    );
    const expected = manifest.checks.filter((check) =>
      check.file.startsWith('tests/ecommerce/isolated/'),
    );
    const observed = collectChecks(report.suites);
    result.stats = report.stats;
    result.expectedChecks = expected.length;
    const ids = observed.flatMap(({ test }) =>
      (test.annotations || [])
        .filter((annotation) => annotation.type === 'zeouf-check')
        .map((annotation) => annotation.description),
    );
    if (
      run.code !== 0 ||
      report.errors?.length ||
      observed.length !== expected.length ||
      new Set(ids).size !== expected.length ||
      expected.some((check) => !ids.includes(check.id)) ||
      observed.some(
        ({ test }) =>
          checkOutcome(test) !== 'passed' ||
          test.results.length !== 1 ||
          test.results[0].retry !== 0,
      )
    )
      throw new Error(
        'Not every isolated check passed once; inspect browser.log and results.json.',
      );
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    process.exitCode = 1;
  } finally {
    if (server) server.stop();
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Isolated browser coverage: ' + result.status + '. Evidence: ' + output);
  }
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
