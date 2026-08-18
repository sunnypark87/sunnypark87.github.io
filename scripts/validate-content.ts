import { validateContent } from "../src/lib/content/validation";

validateContent()
  .then(({ articles, projects }) => {
    console.log(`Content valid: ${articles.length} article(s), ${projects.length} project(s).`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
