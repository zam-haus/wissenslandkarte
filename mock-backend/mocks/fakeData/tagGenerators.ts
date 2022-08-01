import { faker } from '@faker-js/faker';

export function makeRandomTags() {
    return Array.from(Array(20), (value, key) => faker.company.bsNoun());
};