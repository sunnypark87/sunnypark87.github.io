export function PostBody({ html }: { html: string }) {
  // Only render HTML produced by our remark/rehype sanitizing pipeline.
  return <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
