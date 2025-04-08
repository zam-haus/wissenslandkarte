import type { LoaderArgs } from "@remix-run/node";

import { lowLevelUserLoader } from "./lib/loader-helpers.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { searchParams } = new URL(request.url);

  return lowLevelUserLoader(searchParams.get("userFilter"));
};

export const globalUserLoader = loader;
