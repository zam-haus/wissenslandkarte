import { faker } from '@faker-js/faker';

import { UserDTO, CurrentUserDTO } from '../models/user';

export let CURRENT = makeRandomFakeCurrentUserDTO(0);
export const USERS = [makeUserFromCurrentUser(CURRENT), ...Array.from(Array(20), (value, key) => makeRandomFakeUserDTO(key + 1))];

export function updateCurrentUser(user: CurrentUserDTO) {
	CURRENT = user;
	USERS[0] = makeUserFromCurrentUser(user);
}


export function makeRandomFakeCurrentUserDTO(id: number): CurrentUserDTO {
  faker.setLocale('de');

  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const publicMail = faker.datatype.boolean();

  return {
    id,
    firstName,
    lastName,
    username: faker.internet.userName(firstName, lastName),
    description: faker.lorem.text(),
    tags: faker.random.words().split(' '),
    image: faker.internet.avatar(),
    registrationDate: faker.date.past(),
    contactEmailAddress: faker.internet.email(firstName, lastName),
    isContactEmailAddressPublic: faker.datatype.boolean(),
    phoneNumber: faker.phone.phoneNumber(),
  };
}

export function makeRandomFakeUserDTO(id: number): UserDTO {
  const currentUser = makeRandomFakeCurrentUserDTO(id);

  return makeUserFromCurrentUser(currentUser);
}

function makeUserFromCurrentUser(currentUser: CurrentUserDTO) {
  const user = {...currentUser}  as UserDTO & Partial<CurrentUserDTO>;

  delete user.phoneNumber;
  delete user.firstName;
  delete user.lastName;
  if(!user.isContactEmailAddressPublic) {
      delete user.contactEmailAddress;
  }
  delete user.isContactEmailAddressPublic;

  return user;
}