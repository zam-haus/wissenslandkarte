import { CurrentUserDTO } from '../models/user';
import { makeRandomFakeProjectDto } from './projectGenerators';
import { makeRandomTags as makeRandomTagsDto } from './tagGenerators';
import {
  makeRandomFakeCurrentUserDTO,
  makeRandomFakeUserDTO,
  makeUserFromCurrentUser,
  updateUserWithProject,
} from './userGenerators';

// eslint-disable-next-line import/no-mutable-exports
export let CURRENT_USER = makeRandomFakeCurrentUserDTO(0);
export const USERS = [
  makeUserFromCurrentUser(CURRENT_USER),
  ...Array.from(
    Array(20),
    (value, key) => makeRandomFakeUserDTO(key + 1),
  ),
];

export const PROJECTS = Array.from(
  Array(20),
  (value, key) => makeRandomFakeProjectDto(key, USERS, []),
);

for (const project of PROJECTS) {
  for (const user of project.members) {
    updateUserWithProject(user, project);
  }
}

export const TAGS = makeRandomTagsDto();

export function updateCurrentUser(user: CurrentUserDTO) {
  CURRENT_USER = user;
  USERS[0] = makeUserFromCurrentUser(user);
}
