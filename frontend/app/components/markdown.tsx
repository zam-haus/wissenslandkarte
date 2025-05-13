import Markdown, { Options } from "react-markdown";

export const CommonMarkdown = (options: Options) =>
  Markdown({ allowedElements: ["em", "strong", "ul", "ol", "a", "pre", "p"], ...options });
