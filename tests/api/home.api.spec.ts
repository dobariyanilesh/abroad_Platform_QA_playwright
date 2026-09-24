/**
 * API tests for the Admin › Home page (https://rc-admin.abroad.io/admin/home).
 *
 * Covers every API the page calls:
 *   GET /admin/count               Admin shortcuts counts
 *   GET /user/user-priviliges      Current admin (sidebar, access)
 *   GET /quests                    Current + upcoming, Needs attention, At a glance
 *   GET /admin/wide-search         Sidebar search
 * plus the session they depend on (POST /login, /login-email-2fa, /logout).
 *
 * Read-only: nothing is created or changed. Known bugs are marked with
 * test.fail() and a BUG id from reports/home_api_test_report.md, so the suite
 * stays green today and flags when a fix lands.
 *
 * Credentials come from the environment (never commit them):
 *   ABROAD_EMAIL, ABROAD_PASSWORD, ABROAD_2FA_CODE
 */
import { test, expect, request, APIRequestContext } from '@playwright/test';

const API = 'https://rc-api.abroad.io';
const ADMIN_ORIGIN = 'https://rc-admin.abroad.io';
const EMAIL = process.env.ABROAD_EMAIL ?? '';
const PASSWORD = process.env.ABROAD_PASSWORD ?? '';
const CODE = process.env.ABROAD_2FA_CODE ?? '';
const QUESTS = '/quests?page=1&limit=500&isArchived=false';
const HOME_ENDPOINTS = ['/admin/count', '/user/user-priviliges', QUESTS, '/admin/wide-search?query=Dhruvi'];

// One worker, in order, one login; a failing test does not skip the rest.
test.describe.configure({ mode: 'default' });
test.skip(!EMAIL || !PASSWORD || !CODE, 'Set ABROAD_EMAIL, ABROAD_PASSWORD and ABROAD_2FA_CODE to run the API suite');

let admin: APIRequestContext;
let anon: APIRequestContext;

async function login(ctx: APIRequestContext) {
  const r = await ctx.post('/login', { data: { email: EMAIL, password: PASSWORD, rememberUser: false } });
  expect(r.status()).toBe(200);
  await ctx.get('/setup-email-2fa');
  const v = await ctx.post('/login-email-2fa', { data: { code: CODE } });
  expect(await v.json()).toEqual({ isTwoFactorVerified: true });
}

test.beforeAll(async () => {
  admin = await request.newContext({ baseURL: API });
  anon = await request.newContext({ baseURL: API });
  await login(admin);
});

test.afterAll(async () => {
  await admin?.dispose();
  await anon?.dispose();
});

test.describe('Auth and session', () => {
  test('API-01 every Home endpoint rejects requests without a session', async () => {
    for (const path of HOME_ENDPOINTS) {
      const r = await anon.get(path);
      expect(r.status(), path).toBe(401);
      expect(await r.json()).toMatchObject({ code: 'unauthorize' });
    }
  });

  test('API-02 a forged session cookie is rejected', async () => {
    const forged = await request.newContext({ baseURL: API, extraHTTPHeaders: { cookie: 'st.connect.sid=s%3Aforged.invalid' } });
    expect((await forged.get('/admin/count')).status()).toBe(401);
    await forged.dispose();
  });

  test('API-03 wrong password and unknown email give the same generic error', async () => {
    const wrong = await anon.post('/login', { data: { email: EMAIL, password: 'Wrong@999', rememberUser: false } });
    const unknown = await anon.post('/login', { data: { email: 'no.such.user.qa@example.com', password: 'Wrong@999', rememberUser: false } });
    expect(wrong.status()).toBe(400);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  test('API-04 login validates required fields and types', async () => {
    expect((await anon.post('/login', { data: {} })).status()).toBe(400);
    const nosql = await anon.post('/login', { data: { email: EMAIL, password: { $ne: null } } });
    expect(nosql.status()).toBe(400);
    expect(await nosql.json()).toMatchObject({ code: 'validation_error' });
  });

  test('API-05 malformed JSON body returns 400, not 500', async () => {
    test.fail(true, 'BUG-API-07: malformed JSON returns 500 internal_server_error');
    const r = await anon.post('/login', { headers: { 'content-type': 'application/json' }, data: '{"email":' });
    expect(r.status()).toBe(400);
  });

  test('API-06 password alone (before 2FA) cannot read Home data', async () => {
    const half = await request.newContext({ baseURL: API });
    await half.post('/login', { data: { email: EMAIL, password: PASSWORD, rememberUser: false } });
    for (const path of HOME_ENDPOINTS) {
      const r = await half.get(path);
      expect(r.status(), path).toBe(403);
      expect(await r.json()).toMatchObject({ code: 'two_factor_not_verified' });
    }
    await half.dispose();
  });

  test('API-07 a wrong 2FA code does not unlock the session', async () => {
    const half = await request.newContext({ baseURL: API });
    await half.post('/login', { data: { email: EMAIL, password: PASSWORD, rememberUser: false } });
    await half.get('/setup-email-2fa');
    const r = await half.post('/login-email-2fa', { data: { code: '000000' } });
    expect(await r.json()).toEqual({ isTwoFactorVerified: false });
    expect((await half.get('/admin/count')).status()).toBe(403);
    await half.dispose();
  });

  test('API-08 a wrong 2FA code is answered with a 4xx status', async () => {
    test.fail(true, 'BUG-API-08: wrong code returns HTTP 200 {"isTwoFactorVerified":false}');
    const half = await request.newContext({ baseURL: API });
    await half.post('/login', { data: { email: EMAIL, password: PASSWORD, rememberUser: false } });
    await half.get('/setup-email-2fa');
    const r = await half.post('/login-email-2fa', { data: { code: '000000' } });
    expect(r.status()).toBeGreaterThanOrEqual(400);
    await half.dispose();
  });

  test('API-09 login response exposes no password hash or lockout internals', async () => {
    test.fail(true, 'BUG-API-09: response includes invalidAttempts and lockUntil');
    const ctx = await request.newContext({ baseURL: API });
    const body = await (await ctx.post('/login', { data: { email: EMAIL, password: PASSWORD, rememberUser: false } })).json();
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/"password"|\$2[aby]\$/);
    expect(body).not.toHaveProperty('invalidAttempts');
    expect(body).not.toHaveProperty('lockUntil');
    await ctx.dispose();
  });

  test('API-10 session cookie is HttpOnly, Secure and SameSite', async () => {
    test.fail(true, 'BUG-API-05: st.connect.sid is sent without the Secure flag');
    const cookie = (await admin.storageState()).cookies.find(c => c.name === 'st.connect.sid');
    expect(cookie).toBeTruthy();
    expect(cookie!.httpOnly).toBe(true);
    expect(['Lax', 'Strict']).toContain(cookie!.sameSite);
    expect(cookie!.secure).toBe(true);
  });

  test('API-11 logout invalidates the session on the server', async () => {
    const ctx = await request.newContext({ baseURL: API });
    await login(ctx);
    const saved = await ctx.storageState();
    expect((await ctx.post('/logout')).status()).toBe(200);
    const replay = await request.newContext({ baseURL: API, storageState: saved });
    expect((await replay.get('/admin/count')).status()).toBe(401);
    await replay.dispose();
    await ctx.dispose();
  });
});

test.describe('Security headers and CORS', () => {
  test('API-12 responses carry HSTS, nosniff, frame and no-store headers', async () => {
    for (const path of HOME_ENDPOINTS) {
      const h = (await admin.get(path)).headers();
      expect(h['content-type'], path).toContain('application/json');
      expect(h['strict-transport-security'], path).toContain('max-age=');
      expect(h['x-content-type-options'], path).toBe('nosniff');
      expect(h['x-frame-options'], path).toBe('SAMEORIGIN');
      expect(h['cache-control'], path).toContain('no-store');
      expect(h['x-powered-by'], path).toBeUndefined();
    }
  });

  test('API-13 CORS allows the admin origin with credentials', async () => {
    const h = (await admin.get('/admin/count', { headers: { Origin: ADMIN_ORIGIN } })).headers();
    expect(h['access-control-allow-origin']).toBe(ADMIN_ORIGIN);
    expect(h['access-control-allow-credentials']).toBe('true');
  });

  for (const origin of ['https://evil.example.com', 'https://rc-admin.abroad.io.attacker.com', 'null']) {
    test(`API-14 CORS does not trust foreign origin ${origin}`, async () => {
      test.fail(true, 'BUG-API-01: any Origin is reflected with Access-Control-Allow-Credentials: true');
      const h = (await admin.get('/admin/count', { headers: { Origin: origin } })).headers();
      expect(h['access-control-allow-origin']).not.toBe(origin);
    });
  }

  test('API-15 server header does not reveal software versions', async () => {
    test.fail(true, 'BUG-API-10: Server: nginx/1.18.0 (Ubuntu)');
    const h = (await admin.get('/admin/count')).headers();
    expect(h['server'] ?? '').not.toMatch(/\d+\.\d+/);
  });
});

test.describe('GET /admin/count (Admin shortcuts)', () => {
  const KEYS = ['usersCount', 'companiesCount', 'ecosystemCount', 'coachesCount', 'teamsCount', 'promoCount', 'assessmentCount'];

  test('API-16 returns every shortcut count as a non-negative integer', async () => {
    const r = await admin.get('/admin/count');
    expect(r.status()).toBe(200);
    const body = await r.json();
    for (const k of KEYS) {
      expect(Number.isInteger(body[k]), k).toBe(true);
      expect(body[k], k).toBeGreaterThanOrEqual(0);
    }
  });

  test('API-17 counts match the lists the shortcuts open', async () => {
    const c = await (await admin.get('/admin/count')).json();
    const companies = await (await admin.get('/companies')).json();
    const networks: unknown[] = await (await admin.get('/admin/ecosystem')).json();
    const promos: { status: boolean }[] = await (await admin.get('/promo')).json();
    expect(c.companiesCount).toBe(companies.length);
    expect(c.ecosystemCount).toBe(new Set(networks.map(n => JSON.stringify(n))).size);
    expect(c.promoCount).toBe(promos.filter(p => p.status === true).length);
  });

  test('API-18 supports conditional requests (ETag → 304)', async () => {
    const first = await admin.get('/admin/count');
    const etag = first.headers()['etag'];
    expect(etag).toBeTruthy();
    expect((await admin.get('/admin/count', { headers: { 'If-None-Match': etag } })).status()).toBe(304);
  });

  test('API-19 answers within 1.5 s', async () => {
    const t = Date.now();
    await (await admin.get('/admin/count')).body();
    expect(Date.now() - t).toBeLessThan(1500);
  });
});

test.describe('GET /user/user-priviliges (current admin)', () => {
  test('API-20 identifies the signed-in admin without sensitive fields', async () => {
    const r = await admin.get('/user/user-priviliges');
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.isAdmin).toBe(true);
    expect(typeof body.id).toBe('string');
    expect(Object.keys(body).filter(k => /pass|hash|secret|token|otp/i.test(k))).toEqual([]);
  });
});

test.describe('GET /quests (experience cards, Needs attention, At a glance)', () => {
  type Quest = {
    id: string; _id: string; name: string; isPublished: boolean; participantsCount: number; location?: string;
    programDates?: { questStartDate: string | null; questEndDate: string | null };
    readiness: Record<'prosperity' | 'enrollment' | 'prep', { ok: boolean; issues: number }>;
  };
  let quests: Quest[];

  test.beforeAll(async () => {
    quests = await (await admin.get(QUESTS)).json();
  });

  test('API-21 returns an array of experiences with unique ids', async () => {
    expect(Array.isArray(quests)).toBe(true);
    expect(quests.length).toBeGreaterThan(0);
    expect(new Set(quests.map(q => q.id)).size).toBe(quests.length);
  });

  test('API-22 every experience has the fields the Home cards use', async () => {
    for (const q of quests) {
      expect(q.id, q.name).toBe(q._id);
      expect(typeof q.name).toBe('string');
      expect(typeof q.isPublished, q.name).toBe('boolean');
      expect(Number.isInteger(q.participantsCount) && q.participantsCount >= 0, q.name).toBe(true);
      for (const k of ['prosperity', 'enrollment', 'prep'] as const) {
        const r = q.readiness[k];
        expect(typeof r.ok, `${q.name} ${k}`).toBe('boolean');
        expect(Number.isInteger(r.issues) && r.issues >= 0, `${q.name} ${k}`).toBe(true);
        expect(r.ok, `${q.name} ${k}: ok must mean issues = 0`).toBe(r.issues === 0);
      }
    }
  });

  test('API-23 programme dates are ISO strings and start ≤ end', async () => {
    for (const q of quests) {
      const { questStartDate: s, questEndDate: e } = q.programDates ?? { questStartDate: null, questEndDate: null };
      for (const d of [s, e]) if (d !== null) expect(Number.isNaN(Date.parse(d)), q.name).toBe(false);
      if (s && e) expect(Date.parse(s), q.name).toBeLessThanOrEqual(Date.parse(e));
    }
  });

  test('API-24 experience names are stored trimmed and unique', async () => {
    test.fail(true, 'BUG-API-11: 4 names have leading/trailing spaces; "True Prosperity Discover" exists twice');
    for (const q of quests) expect(q.name, JSON.stringify(q.name)).toBe(q.name.trim());
    const names = quests.map(q => q.name.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  test('API-25 paging past the end returns an empty page', async () => {
    const p1: Quest[] = await (await admin.get('/quests?page=1&limit=5&isArchived=false')).json();
    expect(p1).toHaveLength(5);
    const far = await (await admin.get('/quests?page=999&limit=5&isArchived=false')).json();
    expect(far).toEqual([]);
  });

  test('API-25b paging 5 at a time returns every experience exactly once', async () => {
    test.fail(true, 'BUG-API-03: sort by start date has no tie-breaker, so pages repeat and skip experiences');
    const seen: string[] = [];
    for (let page = 1; page <= Math.ceil(quests.length / 5); page++) {
      const batch: Quest[] = await (await admin.get(`/quests?page=${page}&limit=5&isArchived=false`)).json();
      seen.push(...batch.map(q => q.id));
    }
    expect(seen.length).toBe(new Set(seen).size);
    expect(quests.filter(q => !seen.includes(q.id)).map(q => q.name)).toEqual([]);
  });

  test('API-26 page and limit are required', async () => {
    const r = await admin.get('/quests');
    expect(r.status()).toBe(400);
    expect(await r.json()).toMatchObject({ code: 'validation_error' });
  });

  for (const page of ['0', '-1']) {
    test(`API-27 page=${page} is rejected with 400, not 500`, async () => {
      test.fail(true, 'BUG-API-02: page ≤ 0 returns 500 internal_server_error');
      expect((await admin.get(`/quests?page=${page}&limit=5&isArchived=false`)).status()).toBe(400);
    });
  }

  for (const limit of ['0', '-1', 'abc', '100000']) {
    test(`API-28 limit=${limit} is rejected or capped`, async () => {
      test.fail(true, 'BUG-API-04: invalid or huge limit returns every record (or 1 for -1)');
      const r = await admin.get(`/quests?page=1&limit=${limit}`);
      if (r.status() === 200) expect((await r.json()).length).toBeLessThanOrEqual(500);
      else expect(r.status()).toBe(400);
      expect(r.status()).toBe(400);
    });
  }

  test('API-29 isArchived must be a boolean (blocks operator injection)', async () => {
    for (const q of ['isArchived=abc', 'isArchived[$ne]=x', 'page[$gt]=0']) {
      const r = await admin.get(`/quests?page=1&limit=5&${q}`);
      expect(r.status(), q).toBe(400);
    }
  });

  test('API-30 active and archived lists are disjoint and together cover every experience', async () => {
    test.fail(true, 'BUG-API-06: 7 experiences are in neither list, so Home never shows them');
    const archived: Quest[] = await (await admin.get('/quests?page=1&limit=500&isArchived=true')).json();
    const all: Quest[] = await (await admin.get('/quests?page=1&limit=100000')).json();
    const ids = new Set([...quests, ...archived].map(q => q.id));
    expect(quests.filter(q => archived.some(a => a.id === q.id))).toEqual([]);
    expect(all.filter(q => !ids.has(q.id)).map(q => q.name)).toEqual([]);
  });

  test('API-31 returns a total so the client can tell when a page is cut', async () => {
    test.fail(true, 'OBS: no total/count header; Home cannot detect more than 500 experiences');
    const h = (await admin.get(QUESTS)).headers();
    expect(Object.keys(h).some(k => /total|count|link|range/i.test(k))).toBe(true);
  });

  test('API-32 answers within 2 s and is compressed', async () => {
    const t = Date.now();
    const r = await admin.get(QUESTS, { headers: { 'Accept-Encoding': 'br, gzip' } });
    await r.body();
    expect(Date.now() - t).toBeLessThan(2000);
    expect(['br', 'gzip']).toContain(r.headers()['content-encoding']);
  });
});

test.describe('GET /admin/wide-search (sidebar search)', () => {
  const GROUPS = ['companies', 'ecosystems', 'users', 'teams'];

  test('API-33 returns grouped, case-insensitive matches', async () => {
    const lower = await (await admin.get('/admin/wide-search?query=dhruvi')).json();
    const upper = await (await admin.get('/admin/wide-search?query=DHRUVI')).json();
    expect(Object.keys(lower).sort()).toEqual([...GROUPS].sort());
    expect(lower).toEqual(upper);
    expect(lower.companies.every((c: { name: string }) => /dhruvi/i.test(c.name))).toBe(true);
  });

  test('API-34 query is required and cannot be empty', async () => {
    expect((await admin.get('/admin/wide-search')).status()).toBe(400);
    expect((await admin.get('/admin/wide-search?query=')).status()).toBe(400);
  });

  test('API-35 whitespace-only query is rejected', async () => {
    test.fail(true, 'BUG-API-12: "  " is accepted and returns unrelated results');
    expect((await admin.get('/admin/wide-search?query=%20%20')).status()).toBe(400);
  });

  test('API-36 regex characters are treated as text', async () => {
    const all = await (await admin.get('/admin/wide-search?query=.*')).json();
    for (const g of GROUPS) expect(all[g], g).toEqual([]);
    for (const q of ['(', '[', '\\', '^D']) {
      const r = await admin.get('/admin/wide-search?query=' + encodeURIComponent(q));
      expect(r.status(), q).toBe(200);
    }
  });

  test('API-37 operator injection in query is rejected', async () => {
    const r = await admin.get('/admin/wide-search?query[$ne]=x');
    expect(r.status()).toBe(400);
  });

  test('API-38 long, script and emoji queries are handled safely', async () => {
    for (const q of ['x'.repeat(5000), '<script>alert(1)</script>', 'Dhruvi 😀']) {
      const r = await admin.get('/admin/wide-search?query=' + encodeURIComponent(q));
      expect(r.status()).toBe(200);
      expect(r.headers()['content-type']).toContain('application/json');
    }
  });

  test('API-39 search also returns experiences', async () => {
    test.fail(true, 'BUG-API-13: no experiences group; "deeply" finds only a network');
    const body = await (await admin.get('/admin/wide-search?query=deeply')).json();
    expect(Object.keys(body)).toContain('quests');
  });
});

test.describe('General', () => {
  test('API-40 unknown routes return a JSON 404 without internals', async () => {
    const r = await admin.get('/admin/countx');
    expect(r.status()).toBe(404);
    const text = await r.text();
    expect(JSON.parse(text)).toMatchObject({ code: 'not_found' });
    expect(text).not.toMatch(/at \w+ \(|node_modules|stack/i);
  });

  test('API-41 20 concurrent /admin/count calls all succeed', async () => {
    const rs = await Promise.all(Array.from({ length: 20 }, () => admin.get('/admin/count')));
    expect(rs.every(r => r.status() === 200)).toBe(true);
  });
});
