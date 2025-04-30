import type { LoaderFunctionArgs } from "@remix-run/node";

import { lowLevelTagLoader } from "./lib/loader-helpers.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);

  return lowLevelTagLoader(searchParams.get("tagFilter"));
};
