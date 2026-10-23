import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

const packageDocs = (dir: string) =>
  defineDocs({
    dir,
    docs: {
      schema: pageSchema,
      postprocess: {
        includeProcessedMarkdown: true,
      },
    },
    meta: {
      schema: metaSchema,
    },
  });

export const toast = packageDocs('../docs');

export const toastReleased = packageDocs('../docs-publication/.generated/toast/docs');

export default defineConfig();
