import { describe, expect, it } from "vitest";

import { articleFrontmatterSchema, projectFrontmatterSchema } from "./schemas";
import { renderMarkdown } from "./markdown";
import { validateRelationships } from "./validation";
import { buildArticleConnections } from "./articles";
import type { Article } from "./types";

describe("articleFrontmatterSchema", () => {
  it("accepts a valid article and applies defaults", () => {
    const result = articleFrontmatterSchema.parse({
      title: "A title", description: "A description", publishedAt: "2026-08-13",
      status: "exploring", category: "quant",
    });
    expect(result.draft).toBe(false);
    expect(result.relatedArticles).toEqual([]);
  });

  it("rejects an earlier updated date", () => {
    expect(() => articleFrontmatterSchema.parse({
      title: "A title", description: "A description", publishedAt: "2026-08-13", updatedAt: "2026-08-12",
      status: "exploring", category: "quant", draft: false,
    })).toThrow();
  });

  it("rejects invalid calendar dates", () => {
    expect(() => articleFrontmatterSchema.parse({
      title: "A title", description: "A description", publishedAt: "2026-02-31",
      status: "exploring", category: "quant",
    })).toThrow();
  });

  it("rejects duplicate relationship values", () => {
    expect(() => articleFrontmatterSchema.parse({
      title: "A title", description: "A description", publishedAt: "2026-08-18",
      status: "exploring", category: "quant", topics: ["statistics", "statistics"],
    })).toThrow();
  });

  it("rejects the same article across relationship groups", () => {
    const result = articleFrontmatterSchema.safeParse({
      title: "A title", description: "A description", publishedAt: "2026-08-18",
      status: "exploring", category: "quant",
      prerequisites: ["shared-article"], relatedArticles: ["shared-article"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["relatedArticles"],
        message: 'must not repeat "shared-article" from prerequisites',
      }));
    }
  });

  it("accepts null for a project updated date", () => {
    const result = projectFrontmatterSchema.parse({
      title: "A project", description: "A description", startedAt: "2026-08-18",
      updatedAt: null, status: "building",
    });
    expect(result.updatedAt).toBeNull();
  });

  it("renders GFM and code blocks", async () => {
    const rendered = await renderMarkdown("## Heading\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst value = 1;\n```");
    expect(rendered.html).toContain('id="heading"');
    expect(rendered.html).toContain("<table>");
    expect(rendered.html).toContain("const");
  });
});

describe("validateRelationships", () => {
  const article = {
    slug: "published-article",
    sourcePath: "content/articles/published-article/index.md",
    draft: false,
    project: "draft-project",
    prerequisites: [],
    relatedArticles: ["draft-article"],
    nextSteps: [],
  };

  it("rejects draft targets referenced by published articles", () => {
    const errors = validateRelationships(
      [article, { ...article, slug: "draft-article", sourcePath: "draft.md", draft: true, project: null, relatedArticles: [] }],
      [{ slug: "draft-project", draft: true }],
    );
    expect(errors).toContain(`${article.sourcePath}: published article references draft project "draft-project"`);
    expect(errors).toContain(`${article.sourcePath}: published article references draft "draft-article"`);
  });

  it("rejects unknown and self references", () => {
    const errors = validateRelationships(
      [{ ...article, project: "missing-project", relatedArticles: ["published-article", "missing-article"] }],
      [],
    );
    expect(errors).toContain(`${article.sourcePath}: unknown project "missing-project"`);
    expect(errors).toContain(`${article.sourcePath}: cannot reference itself`);
    expect(errors).toContain(`${article.sourcePath}: unknown article "missing-article"`);
  });
});

describe("buildArticleConnections", () => {
  const article = { slug: "article-a", prerequisites: ["article-b"], relatedArticles: [], nextSteps: ["article-c"] } as unknown as Article;
  const linked = (slug: string) => ({ ...article, slug, prerequisites: [], nextSteps: [] });

  it("returns only groups with published, resolvable relationships", () => {
    const groups = buildArticleConnections(article, [article, linked("article-b"), linked("article-c")]);
    expect(groups.map((group) => group.key)).toEqual(["prerequisites", "nextSteps"]);
    expect(groups[0]?.articles[0]?.slug).toBe("article-b");
  });

  it("does not render unresolved relationships", () => {
    const groups = buildArticleConnections(article, [article]);
    expect(groups).toEqual([]);
  });
});
