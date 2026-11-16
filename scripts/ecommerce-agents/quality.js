'use strict';
const ts = require('typescript');

const parse = (source) => {
  const file = ts.createSourceFile(
    'source.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (file.parseDiagnostics.length)
    throw new Error('Generated source has invalid TypeScript syntax');
  return file;
};
const printer = ts.createPrinter({ removeComments: true });
const memberKey = (member, file) => `${member.kind}:${member.name?.getText(file) || 'constructor'}`;

function validateAdditiveLocators(before, after) {
  const original = parse(before),
    changed = parse(after);
  const classOf = (file) =>
    file.statements.find(
      (node) => ts.isClassDeclaration(node) && node.name?.text === 'EcommerceStorefrontPage',
    );
  const oldClass = classOf(original),
    newClass = classOf(changed);
  if (!oldClass || !newClass) throw new Error('Missing storefront page object');
  const existing = new Set(oldClass.members.map((member) => memberKey(member, original)));
  const added = newClass.members.filter((member) => !existing.has(memberKey(member, changed)));
  for (const method of added) {
    const expression =
      method.body?.statements.length === 1 && ts.isReturnStatement(method.body.statements[0])
        ? method.body.statements[0].expression
        : null;
    if (
      !ts.isMethodDeclaration(method) ||
      !expression ||
      !ts.isCallExpression(expression) ||
      !ts.isPropertyAccessExpression(expression.expression) ||
      !['getByRole', 'getByText', 'getByTestId', 'getByLabel', 'locator'].includes(
        expression.expression.name.text,
      )
    )
      throw new Error('Generator may add only simple locator-returning methods');
  }
  const transformed = ts.transform(changed, [
    (context) => {
      const visit = (node) =>
        node === newClass
          ? ts.factory.updateClassDeclaration(
              node,
              node.modifiers,
              node.name,
              node.typeParameters,
              node.heritageClauses,
              node.members.filter((member) => existing.has(memberKey(member, changed))),
            )
          : ts.visitEachChild(node, visit, context);
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  const matches = printer.printFile(original) === printer.printFile(transformed.transformed[0]);
  transformed.dispose();
  if (!matches) throw new Error('Generation refactor changed existing page-object behavior');
  return added.map((method) => method.name.getText(changed));
}

function validateSelectorRefactor(before, after, getters) {
  const normalize = (text) => {
    const file = parse(text);
    const transformed = ts.transform(file, [
      (context) => {
        const visit = (node) => {
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const receiver = node.expression.expression.getText(file),
              method = node.expression.name.text;
            if (
              (receiver === 'storefront.footer' && ['getByRole', 'getByText'].includes(method)) ||
              (receiver === 'storefront' && getters.includes(method))
            )
              return ts.factory.createIdentifier('__CENTRALIZED_LOCATOR__');
          }
          return ts.visitEachChild(node, visit, context);
        };
        return (node) => ts.visitNode(node, visit);
      },
    ]);
    const value = printer.printFile(transformed.transformed[0]);
    transformed.dispose();
    return value;
  };
  if (normalize(before) !== normalize(after))
    throw new Error('Generation refactor changed assertions or scenario steps');
}
function validateRehearsalContract(source, expectedNotice) {
  const file = parse(source),
    guards = new Set();
  let noticeAssertion = false,
    zeroWritesAssertion = false,
    submit = false;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isAwaitExpression(node.initializer)
    ) {
      const call = node.initializer.expression;
      if (
        ts.isCallExpression(call) &&
        ts.isIdentifier(call.expression) &&
        call.expression.text === 'blockEcommerceWrites'
      )
        guards.add(node.name.text);
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      if (method === 'submitNewsletterPreview') submit = true;
      const receiver = node.expression.expression;
      if (
        ts.isCallExpression(receiver) &&
        ts.isIdentifier(receiver.expression) &&
        receiver.expression.text === 'expect'
      ) {
        const target = receiver.arguments[0],
          value = node.arguments[0];
        if (
          method === 'toHaveText' &&
          target &&
          ts.isPropertyAccessExpression(target) &&
          target.name.text === 'newsletterPreviewNotice' &&
          value &&
          ts.isStringLiteral(value) &&
          value.text === expectedNotice
        )
          noticeAssertion = true;
        if (
          method === 'toEqual' &&
          target &&
          ts.isIdentifier(target) &&
          guards.has(target.text) &&
          value &&
          ts.isArrayLiteralExpression(value) &&
          value.elements.length === 0
        )
          zeroWritesAssertion = true;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!noticeAssertion || !zeroWritesAssertion || !submit)
    throw new Error('Generated rehearsal must assert the exact notice and zero attempted writes');
}
module.exports = { validateAdditiveLocators, validateSelectorRefactor, validateRehearsalContract };
