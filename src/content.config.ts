import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ハナコ（agents/media_engine）が出力する frontmatter と同じ型を Astro 側でも宣言。
// これにより記事の frontmatter ミスがビルド時に検出される（hanakoのSEO要件と二重チェック）。
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().max(32, 'titleは32文字以内（hanako仕様）'),
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugは小文字英数字とハイフン'),
		meta_description: z.string().max(120, 'meta_descriptionは120文字以内（hanako仕様）'),
		content_type: z.enum(['tool_intro', 'case_study', 'news_analysis', 'opinion']),
		target_keyword: z.string(),
		sub_keywords: z.array(z.string()).default([]),
		author: z.string().default('不動産AIジャーナル編集部'),
		supervisor: z.string().optional(),
		published_date: z.coerce.date(),
		schema_type: z.enum(['Article', 'FAQPage', 'HowTo']).default('Article'),
		// 公開待ち記事: draft=true は一覧・記事ページ・RSSから除外される。
		// GitHub Actionsの daily-publish ワークフローが毎日9:00 JSTに最古のdraftをfalse化して公開する。
		draft: z.boolean().default(false),
		internal_links: z
			.array(
				z.object({
					anchor: z.string(),
					target: z.string(),
				}),
			)
			.min(3)
			.max(7),
		images: z
			.array(
				z.object({
					placement: z.string(),
					filename: z.string(),
					url: z.string().optional(),
					alt: z.string(),
					purpose: z.string().optional(),
					suggested_search: z.array(z.string()).optional(),
					suggested_size: z.string().optional(),
				}),
			)
			.optional(),
		image_alt: z.array(z.string()).optional(),
	}),
});

export const collections = { blog };
