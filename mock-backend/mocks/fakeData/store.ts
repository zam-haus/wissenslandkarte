import { CurrentUserDTO } from '../models/user';
import { makeRandomFakeProjectDto } from './projectGenerators';
import { makeRandomTags as makeRandomTagsDto } from './tagGenerators';
import { makeRandomFakeCurrentUserDTO, makeRandomFakeUserDTO, makeUserFromCurrentUser } from './userGenerators';



export let CURRENT_USER = makeRandomFakeCurrentUserDTO(0);
export const USERS = [makeUserFromCurrentUser(CURRENT_USER), ...Array.from(Array(20), (value, key) => makeRandomFakeUserDTO(key + 1))];

export const PROJECTS = Array.from(Array(20), (value, key) => makeRandomFakeProjectDto(key, USERS, []));
export const TAGS = makeRandomTagsDto();


export function updateCurrentUser(user: CurrentUserDTO) {
    CURRENT_USER = user;
    USERS[0] = makeUserFromCurrentUser(user);
}
