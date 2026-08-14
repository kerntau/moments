import markdownit from 'markdown-it';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import { createHighlighterCore } from 'shiki/core';

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

let highlighterPromise: Promise<any> | null = null;

const initMarkdownHighlighter = () => {
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = createHighlighterCore({
    themes: [import('shiki/themes/github-dark.mjs')],
    langs: [
      import('shiki/langs/c.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/shellscript.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/xml.mjs'),
      import('shiki/langs/yaml.mjs'),
      import('shiki/langs/go.mjs'),
    ],
    loadWasm: import('shiki/wasm'),
  }).then((highlighter) => {
    md.use(
      //@ts-ignore
      fromHighlighter(highlighter, {
        themes: {
          light: 'github-dark',
          dark: 'github-dark',
        },
      })
    );
    return highlighter;
  });

  return highlighterPromise;
};

// 预先触发初始化
initMarkdownHighlighter();

export const renderMarkdown = (content: string): string => {
  if (!content) return '';
  return md.render(content);
};
