import { faker } from '@faker-js/faker';

export const TAGS = Array.from(Array(20), (value, key) => faker.company.bsNoun());