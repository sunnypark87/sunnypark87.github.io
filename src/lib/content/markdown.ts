import { unified } from "unified";
import GithubSlugger from "github-slugger";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

import type { Heading } from "./types";

const prettyCodeOptions = {
  theme: "github-dark-dimmed",
  keepBackground: false,
};

export async function renderMarkdown(markdown: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypePrettyCode, prettyCodeOptions as never)
    .use(rehypeStringify);
  const file = await tree.process(markdown);
  const headings = extractHeadings(markdown);
  return { html: String(file), headings };
}

function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  return markdown.split("\n")
    .map((line) => /^(#{2,4})\s+(.+?)\s*#*$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const text = match[2].replace(/[`*_]/g, "").trim();
      return { depth: match[1].length, id: slugger.slug(text), text };
    });
}
