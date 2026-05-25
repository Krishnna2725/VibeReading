const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const scriptPath = path.join(__dirname, '..', 'note-share-export.js');
const code = fs.readFileSync(scriptPath, 'utf8');
const downloads = [];
const sandbox = {
  window: { setTimeout(){} },
  document: {
    body: { appendChild(){} },
    createElement(tag) {
      assert.equal(tag, 'a');
      return {
        href: '',
        download: '',
        click() { downloads.push({ href: this.href, download: this.download }); },
        remove(){}
      };
    }
  },
  console,
  URL: { createObjectURL(){ return 'blob:test'; }, revokeObjectURL(){} },
  Blob: class Blob { constructor(parts, opts){ this.parts = parts; this.type = opts && opts.type; } }
};
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);

assert.ok(sandbox.window.VibeReadingNoteShare, 'exports helper on window');
const md = sandbox.window.VibeReadingNoteShare.buildMarkdown({
  bookTitle: '1984',
  author: '乔治·奥威尔',
  stageLabel: '第一部分 · 被注视',
  stageSubtitle: '审讯灯 + 窗上雨声：先读空间压力。',
  note: '这是一条边注。',
  createdAt: new Date('2026-04-29T00:00:00Z')
});
assert.match(md, /^# 1984 边注/);
assert.match(md, /乔治·奥威尔/);
assert.match(md, /第一部分 · 被注视/);
assert.match(md, /这是一条边注。/);
const empty = sandbox.window.VibeReadingNoteShare.saveMarkdown({ note: '' });
assert.equal(empty.ok, false);
const saved = sandbox.window.VibeReadingNoteShare.saveMarkdown({
  bookTitle: '1984',
  author: '乔治·奥威尔',
  stageLabel: '第一部分 · 被注视',
  stageSubtitle: '审讯灯 + 窗上雨声：先读空间压力。',
  note: '这是一条边注。',
  createdAt: new Date('2026-04-29T00:00:00Z'),
  filenamePrefix: '1984'
});
assert.equal(saved.ok, true);
assert.equal(downloads.length, 1);
assert.match(downloads[0].download, /^1984-note-.*\.md$/);
console.log('note-share-export md tests passed');
