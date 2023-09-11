import type { V2_MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";


export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">

      <div className="mx-auto mt-16 max-w-7xl text-center">
        <Link
          to="/users"
          className="text-xl text-blue-600 underline"
        >
          Users
        </Link><br />
        <Link
          to="/projects"
          className="text-xl text-blue-600 underline"
        >
          Projects
        </Link>
      </div>
    </main>
  );
}
