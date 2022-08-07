import { writable } from 'svelte/store';
import type { UserDTO, UserId } from '../../../mock-backend/mocks/models/user';

export const generalUsersStore = writable<{ [id: UserId]: UserDTO }>({});

export function addUsers(users: UserDTO[]): void {
  const newUsers = Object.fromEntries(users.map((user) => [user.id, user]));
  generalUsersStore.update((existingUsers) => ({ ...existingUsers, ...newUsers }));
}

export const addUser = (user: UserDTO) => addUsers([user]);

export function removeUser(userId: UserId) {
  generalUsersStore.update((data) => {
    const dataCopy = { ...data };
    delete dataCopy[userId];
    return dataCopy;
  });
}
