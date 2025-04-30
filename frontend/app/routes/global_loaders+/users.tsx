import type { LoaderFunctionArgs } from "@remix-run/node";

import { lowLevelUserLoader } from "./lib/loader-helpers.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);

  return lowLevelUserLoader(searchParams.get("userFilter"));
};

export const globalUserLoader = loader;
