export function wait(timeout = 300): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
