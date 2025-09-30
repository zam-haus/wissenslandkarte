import { LoaderFunctionArgs } from "@remix-run/node";

import { getFinishedProjects } from "~/database/repositories/projects.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { after, before } = getDateRangeFromRequest(request);
  const pageParam = new URL(request.url).searchParams.get("page");
  const parsedPage = parseInt(pageParam ?? "0", 10);
  const page = isNaN(parsedPage) ? 0 : parsedPage;

  return Response.json({
    page,
    projects: await getFinishedProjects(after, before, page),
  });
};

function getDateRangeFromRequest(request: Request) {
  const url = new URL(request.url);
  const afterParam = url.searchParams.get("after");
  const beforeParam = url.searchParams.get("before");

  if (afterParam === null || beforeParam === null) {
    throw new Response(JSON.stringify({ error: "Invalid Request: missing after or before" }), {
      status: 400,
      statusText: "Invalid Request: missing after or before",
    });
  }

  const after = parseInt(afterParam, 10);
  const before = parseInt(beforeParam, 10);

  if (isNaN(after) || isNaN(before) || after < 0 || before < 0) {
    throw new Response(JSON.stringify({ error: "Invalid Request: invalid after or before" }), {
      status: 400,
      statusText: "Invalid Request: invalid after or before",
    });
  }

  if (after >= before) {
    throw new Response(
      JSON.stringify({ error: "Invalid Request: after must be smaller than before" }),
      {
        status: 400,
        statusText: "Invalid Request: after must be smaller than before",
      },
    );
  }

  return { after: new Date(after * 1000), before: new Date(before * 1000) };
}
