import { faker } from '@faker-js/faker';

export function makeRandomTags() {
  return Array.from(Array(20), () => faker.company.bsNoun());
}
