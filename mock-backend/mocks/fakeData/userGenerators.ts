import { faker } from '@faker-js/faker';

import { ProjectDTO } from '../models/project';
import { CurrentUserDTO, UserDTO } from '../models/user';

export function updateUserWithProject(user: UserDTO, project: ProjectDTO) {
  user.projectsShortInfo.push({
    id: project.id,
    title: project.title,
    mainPhoto: project.mainPhoto,
    latestModificationDate: project.latestModificationDate,
  });
}

export function makeRandomFakeCurrentUserDTO(id: number): CurrentUserDTO {
  faker.setLocale('de');

  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  return {
    id,
    firstName,
    lastName,
    username: faker.internet.userName(firstName, lastName),
    description: faker.lorem.paragraphs(2),
    tags: faker.random.words().split(' '),
    image: faker.internet.avatar(),
    registrationDate: faker.date.past(),
    contactEmailAddress: faker.internet.email(firstName, lastName),
    isContactEmailAddressPublic: faker.datatype.boolean(),
    phoneNumber: faker.phone.phoneNumber(),
    projectsShortInfo: [],
  };
}

export function makeUserFromCurrentUser(currentUser: CurrentUserDTO) {
  const user = { ...currentUser } as UserDTO & Partial<CurrentUserDTO>;

  delete user.phoneNumber;
  delete user.firstName;
  delete user.lastName;
  if (!user.isContactEmailAddressPublic) {
    delete user.contactEmailAddress;
  }
  delete user.isContactEmailAddressPublic;

  return user;
}

export function makeRandomFakeUserDTO(id: number): UserDTO {
  const currentUser = makeRandomFakeCurrentUserDTO(id);

  return makeUserFromCurrentUser(currentUser);
}
