// Long-form Markdown pages, one file per language: src/content/pages/<locale>/<path>.md.
// Entry ids keep that shape (e.g. "de/choices/notes"); ProsePage picks the
// reader's language and falls back to English.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    kicker: z.string().optional(),
  }),
});

export const collections = { pages };
