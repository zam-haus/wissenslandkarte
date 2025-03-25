import type { LoaderArgs } from "@remix-run/node";

import { lowLevelTagLoader } from "./lib/loader-helpers.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { searchParams } = new URL(request.url);

  return lowLevelTagLoader(searchParams.get("tagFilter"));
};

export const globalTagLoader = loader;
