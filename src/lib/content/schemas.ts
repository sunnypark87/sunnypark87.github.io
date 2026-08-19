import { z } from "zod";

import { ARTICLE_CATEGORIES, CONTENT_STATUSES } from "./constants";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase slug");
const isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "must be a valid date");

const relationFields = ["topics", "prerequisites", "relatedArticles", "nextSteps"] as const;
const articleRelationFields = ["prerequisites", "relatedArticles", "nextSteps"] as const;

const dateOrderRefinement = <T extends { publishedAt: string; updatedAt?: string }>(value: T, ctx: z.RefinementCtx) => {
  if (value.updatedAt && value.updatedAt < value.publishedAt) {
    ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "must not be earlier than publishedAt" });
  }
};

export const articleFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema.optional(),
  status: z.enum(CONTENT_STATUSES),
  category: z.enum(ARTICLE_CATEGORIES),
  topics: z.array(slugSchema).default([]),
  project: slugSchema.nullable().default(null),
  prerequisites: z.array(slugSchema).default([]),
  relatedArticles: z.array(slugSchema).default([]),
  nextSteps: z.array(slugSchema).default([]),
  draft: z.boolean().default(false),
}).superRefine((value, ctx) => {
  dateOrderRefinement(value, ctx);
  for (const field of relationFields) {
    if (new Set(value[field]).size !== value[field].length) {
      ctx.addIssue({ code: "custom", path: [field], message: "must not contain duplicate values" });
    }
  }
  const relationOwners = new Map<string, string>();
  for (const field of articleRelationFields) {
    for (const slug of value[field]) {
      const existingField = relationOwners.get(slug);
      if (existingField) {
        ctx.addIssue({ code: "custom", path: [field], message: `must not repeat "${slug}" from ${existingField}` });
      } else {
        relationOwners.set(slug, field);
      }
    }
  }
});

export const projectFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  status: z.enum(CONTENT_STATUSES),
  startedAt: isoDateSchema,
  updatedAt: isoDateSchema.nullable().default(null),
  topics: z.array(slugSchema).default([]),
  repository: z.string().url().nullable().default(null),
  demo: z.string().url().nullable().default(null),
  draft: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.updatedAt && value.updatedAt < value.startedAt) {
    ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "must not be earlier than startedAt" });
  }
  if (new Set(value.topics).size !== value.topics.length) {
    ctx.addIssue({ code: "custom", path: ["topics"], message: "must not contain duplicate values" });
  }
});

export { slugSchema };
