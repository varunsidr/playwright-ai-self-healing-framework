'use strict';

const { before, beforeEach, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { read, websiteRequire } = require('../../../scripts/ecommerce-contracts/source');
const { PGlite } = websiteRequire()('@electric-sql/pglite');
const db = new PGlite();
const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const product = '11111111-1111-4111-8111-111111111111';

before(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      'SELECT NULLIF(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean);`);
  for (const file of [
    'supabase_schema.sql',
    'supabase_reviews_migration.sql',
    'supabase_security_hardening_migration.sql',
    'supabase_review_workflow_migration.sql',
  ])
    await db.exec(read(file));
});

beforeEach(async () => {
  await db.exec('RESET ROLE; TRUNCATE auth.users, public.products CASCADE;');
  await db.query('INSERT INTO auth.users(id) VALUES($1),($2)', [userA, userB]);
  await db.query(
    "INSERT INTO products(id,name,category,price,stock) VALUES($1,'Fictional product','Bags',1000,1)",
    [product],
  );
  for (const [owner, approved, comment] of [
    [userA, true, 'public'],
    [userA, false, 'pending-A'],
    [userB, false, 'pending-B'],
  ])
    await db.query(
      'INSERT INTO reviews(product_id,user_id,name,rating,comment,approved) VALUES($1,$2,$3,5,$4,$5)',
      [product, owner, 'Fictional Reviewer', comment, approved],
    );
});
after(() => db.close());

async function asRole(role, user, action) {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user || '']);
  await db.exec('SET ROLE ' + role);
  try {
    return await action();
  } finally {
    await db.exec('RESET ROLE');
  }
}
const comments = async () =>
  (await db.query('SELECT comment FROM reviews ORDER BY comment')).rows.map((row) => row.comment);

test('TC-REV-004-01 anonymous PostgreSQL role sees approved reviews only', async () => {
  assert.deepEqual(await asRole('anon', null, comments), ['public']);
});
for (const [owner, expected] of [
  [userA, ['pending-A', 'public']],
  [userB, ['pending-B', 'public']],
]) {
  test(
    'TC-REV-004-01 customer ' + owner + ' sees own pending review and approved rows',
    async () => {
      assert.deepEqual(await asRole('authenticated', owner, comments), expected);
    },
  );
}

for (const role of ['anon', 'authenticated']) {
  for (const [operation, sql] of [
    [
      'insert',
      `INSERT INTO reviews(product_id,user_id,name,rating,comment,approved) VALUES('${product}','${userA}','Forged Reviewer',5,'forged',true)`,
    ],
    ['approve', "UPDATE reviews SET approved=true WHERE comment='pending-A'"],
    ['reply', "UPDATE reviews SET admin_reply='forged reply' WHERE comment='public'"],
    ['delete', 'DELETE FROM reviews'],
  ]) {
    test('TC-REV-004-02 ' + role + ' cannot ' + operation + ' reviews directly', async () => {
      await assert.rejects(
        asRole(role, userA, () => db.exec(sql)),
        /permission denied/i,
      );
      assert.deepEqual(await comments(), ['pending-A', 'pending-B', 'public']);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM reviews WHERE admin_reply IS NOT NULL OR (comment LIKE 'pending-%' AND approved=true)",
          )
        ).rows[0].count,
        0,
      );
    });
  }
}

test('TC-REV-004-02 service role retains moderation authority', async () => {
  await asRole('service_role', null, () =>
    db.exec(
      "UPDATE reviews SET approved=true, admin_reply='Authorized reply' WHERE comment='pending-A'",
    ),
  );
  assert.deepEqual(await asRole('anon', null, comments), ['pending-A', 'public']);
});

test('TC-REV-004-01 review image bucket is private after hardening', async () => {
  assert.equal(
    (await db.query("SELECT public FROM storage.buckets WHERE id='review-images'")).rows[0].public,
    false,
  );
});
