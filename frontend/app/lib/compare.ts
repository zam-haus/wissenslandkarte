type DateProperties<T> = {
  [K in keyof T]: T[K] extends Date ? K : never;
}[keyof T];

export function descendingByDatePropertyComparator<T>(property: DateProperties<T>) {
  return (
    a: T & { [key in DateProperties<T>]: Date },
    b: T & { [key in DateProperties<T>]: Date },
  ) => b[property].getTime() - a[property].getTime();
}
