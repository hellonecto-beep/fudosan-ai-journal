#!/usr/bin/env node
/**
 * Daily Publish: src/content/blog/ にある最古のdraft記事を1本だけ
 * draft=false に切り替え、published_date を今日（JST）に更新する。
 *
 * 同じ日に複数回走らせても、1回の実行で公開するのは最大1本だけ。
 * キューが空なら exit 0 で静かに終わる（commitなし）。
 */

const fs = require('node:fs');
const path = require('node:path');

const BLOG_DIR = path.join(__dirname, '..', '..', 'src', 'content', 'blog');

function toJstDateString(now = new Date()) {
	// JST = UTC+9
	const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	return jst.toISOString().split('T')[0]; // YYYY-MM-DD
}

function splitFrontmatter(text) {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return null;
	return { fm: match[1], body: match[2] };
}

function joinFrontmatter(fm, body) {
	return `---\n${fm}\n---\n${body}`;
}

function isDraft(fm) {
	return /^draft\s*:\s*true\s*$/m.test(fm);
}

function setDraftFalse(fm) {
	return fm.replace(/^draft\s*:\s*true\s*$/m, 'draft: false');
}

function setPublishedDate(fm, dateStr) {
	if (/^published_date\s*:/m.test(fm)) {
		return fm.replace(/^published_date\s*:.*$/m, `published_date: "${dateStr}"`);
	}
	return `${fm}\npublished_date: "${dateStr}"`;
}

function main() {
	if (!fs.existsSync(BLOG_DIR)) {
		console.log(`[publish-next] blog dir not found: ${BLOG_DIR}`);
		process.exit(0);
	}

	const files = fs
		.readdirSync(BLOG_DIR)
		.filter((f) => /\.(md|mdx)$/.test(f))
		.filter((f) => !f.startsWith('_'))
		.sort(); // ファイル名は YYYY-MM-DD-slug.md 想定。古い順に並ぶ

	for (const file of files) {
		const filePath = path.join(BLOG_DIR, file);
		const content = fs.readFileSync(filePath, 'utf8');
		const split = splitFrontmatter(content);
		if (!split) continue;
		if (!isDraft(split.fm)) continue;

		const today = toJstDateString();
		let newFm = setDraftFalse(split.fm);
		newFm = setPublishedDate(newFm, today);

		const newContent = joinFrontmatter(newFm, split.body);
		fs.writeFileSync(filePath, newContent, 'utf8');

		console.log(`[publish-next] PUBLISHED: ${file} (published_date set to ${today})`);
		process.exit(0);
	}

	console.log('[publish-next] no draft articles in queue. nothing to publish.');
	process.exit(0);
}

main();
