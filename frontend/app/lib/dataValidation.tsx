export function assertExistsOr404(resource: unknown, statusText = "Not Found"): asserts resource {
  assertExistsOrError(resource, 404, statusText);
}

export function assertExistsOr400(
  resource: unknown,
  statusText = "Invalid Request",
): asserts resource {
  assertExistsOrError(resource, 400, statusText);
}

export function assertExistsOr500(
  resource: unknown,
  statusText = "Internal Server Error",
): asserts resource {
  assertExistsOrError(resource, 500, statusText);
}

export function assertExistsOrError(
  resource: unknown,
  status: number,
  statusText: string,
): asserts resource {
  if (resource === undefined || resource === null) {
    throw new Response(null, {
      status,
      statusText,
    });
  }
}
