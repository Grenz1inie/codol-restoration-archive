import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateArchive, loadArchive, type ArchiveRecord, type ArchiveLog } from '../src/lib/archive';

// Synthetic data stays in test code only. These are not claims about COD:OL.
function record(overrides: Partial<ArchiveRecord> = {}): ArchiveRecord {
  return {
    id: 'test-only', title: '仅用于验证数据约束', category: 'frontend', gameVersion: '3.19.26.22',
    availability: 'unverified', workStatus: 'notDisclosed', accessStatus: 'notDisclosed',
    summary: '自动测试中的合成数据，不是项目成果。', limitations: [], verifiedAt: null,
    updatedAt: null, evidence: [], relatedLogIds: [], approvedPublic: true, ...overrides,
  };
}
function log(overrides: Partial<ArchiveLog> = {}): ArchiveLog {
  return { id: 'test-log', title: '测试日志', date: '2024-02-29', gameVersion: '3.19.26.22',
    summary: '仅用于自动测试', relatedRecordIds: [], approvedPublic: true, body: '仅用于自动测试。', ...overrides };
}

test('an empty public archive is valid and does not invent progress', () => {
  assert.deepEqual(validateArchive([], []), { records: [], logs: [] });
});

test('unapproved and missing approval data fail before rendering', () => {
  assert.throws(() => validateArchive([{ ...record(), approvedPublic: false }], []));
  const { approvedPublic: _approval, ...missing } = record();
  assert.throws(() => validateArchive([missing], []));
  assert.throws(() => validateArchive([], [{ ...log(), approvedPublic: false }]));
});

test('availability, engineering status and access status remain independent', () => {
  const result = validateArchive([record({ availability: 'partial', workStatus: 'blocked', accessStatus: 'notPublic', limitations: ['测试阻碍'] })], []);
  assert.equal(result.records[0].accessStatus, 'notPublic');
  assert.equal(result.records[0].workStatus, 'blocked');
  assert.throws(() => validateArchive([record({ workStatus: 'blocked' })], []));
  assert.throws(() => validateArchive([record({ availability: 'partial' })], []));
});

test('verified availability needs both date and evidence', () => {
  assert.throws(() => validateArchive([record({ availability: 'verified' })], []));
  assert.throws(() => validateArchive([record({ availability: 'verified', verifiedAt: '2024-02-29' })], []));
  const result = validateArchive([record({ availability: 'verified', verifiedAt: '2024-02-29', evidence: [{ id: 'test-evidence', type: 'document', title: '测试链接', url: 'https://example.org/evidence', description: '合成测试证据' }] })], []);
  assert.equal(result.records[0].availability, 'verified');
});

test('real explicit calendar dates and chronology are required', () => {
  assert.doesNotThrow(() => validateArchive([record({ updatedAt: '2024-02-29' })], []));
  for (const date of ['2023-02-29', '2024-04-31', '2024-13-01', 'today', '2024-01-01T00:00:00Z']) {
    assert.throws(() => validateArchive([record({ updatedAt: date })], []));
  }
  assert.throws(() => validateArchive([record({ updatedAt: '2024-02-28', verifiedAt: '2024-02-29' })], []));
  assert.throws(() => validateArchive([], [log({ date: '2023-02-29' })]));
});

test('public evidence cannot point at unsafe schemes, credentials or local addresses', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'http://example.org/a', 'https://localhost/a', 'https://localhost./a', 'https://service.local./a', 'https://service.internal./a', 'https://127.0.0.1/a', 'https://10.0.0.1/a', 'https://[::1]/a', 'https://user:password@example.org/a', 'https://site.internal/a']) {
    assert.throws(() => validateArchive([record({ evidence: [{ id: 'test-evidence', type: 'document', title: '测试链接', url, description: '测试' }] })], []), url);
  }
  assert.throws(() => validateArchive([record({ evidence: [{ id: 'test-image', type: 'image', title: '测试影像', url: 'https://example.org/test.png', description: '测试' }] })], []));
});

test('stable unique IDs and references reject broken detail and log links', () => {
  assert.throws(() => validateArchive([record({ id: '../escape' })], []));
  assert.throws(() => validateArchive([record(), record()], []));
  assert.throws(() => validateArchive([], [log(), log()]));
  assert.throws(() => validateArchive([record({ relatedLogIds: ['missing'] })], []));
  assert.throws(() => validateArchive([], [log({ relatedRecordIds: ['missing'] })]));
  assert.doesNotThrow(() => validateArchive([record({ relatedLogIds: ['test-log'] })], [log({ relatedRecordIds: ['test-only'] })]));
});

test('long Chinese text, no media and unknown dates stay honest', () => {
  const item = record({ title: '长中文功能标题'.repeat(20), summary: '较长的中文说明。'.repeat(50) });
  const result = validateArchive([item], []);
  assert.equal(result.records[0].title, item.title);
  assert.equal(result.records[0].updatedAt, null);
  assert.deepEqual(result.records[0].evidence, []);
});

test('raw HTML in Markdown logs is not accepted', () => {
  for (const body of ['<script>alert(1)</script>', '<!DOCTYPE html>', '<?instruction?>', '<!-- hidden -->']) {
    assert.throws(() => validateArchive([], [log({ body })]));
  }
  assert.doesNotThrow(() => validateArchive([], [log({ body: '```html\n<p>quoted code, not raw HTML</p>\n```' })]));
});

test('Markdown evidence links are validated after parsing, including reference links', () => {
  for (const body of ['[unsafe](javascript:alert%281%29)', '![private](https://127.0.0.1/a.png)', '[ref][evidence]\n\n[evidence]: http://example.org/file', '![](https://example.org/image.png)']) {
    assert.throws(() => validateArchive([], [log({ body })]));
  }
  assert.doesNotThrow(() => validateArchive([], [log({ body: '[公开证据](https://example.org/evidence)' })]));
});

test('disk ingestion enforces log file IDs and explicit public approval', () => {
  const root = mkdtempSync(join(tmpdir(), 'codol-content-test-'));
  try {
    mkdirSync(join(root, 'src/data'), { recursive: true });
    mkdirSync(join(root, 'src/content/logs'), { recursive: true });
    writeFileSync(join(root, 'src/data/records.json'), '[]');
    assert.deepEqual(loadArchive(root), { records: [], logs: [] });
    writeFileSync(join(root, 'src/content/logs/wrong-name.md'), '---\nid: test-log\n---\nTest');
    assert.throws(() => loadArchive(root), /filename must match/);
    writeFileSync(join(root, 'src/content/logs/wrong-name.md'), '---javascript\n({id: "wrong-name", sentinel: globalThis.__codolFrontmatterExecuted = true})\n---\nTest');
    assert.throws(() => loadArchive(root), /plain YAML frontmatter/);
    assert.equal((globalThis as Record<string, unknown>).__codolFrontmatterExecuted, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
