import { writable } from 'svelte/store';
import type { UserDTO } from '../../../mock-backend/mocks/models/user';
import { loadUser, loadUsers } from '../services/api';


type UserId = UserDTO['id'];

export const generalUsersStore = writable<{ [id: UserId]: UserDTO }>({});

export function addUsers(users: UserDTO[]): void {
    const newUsers = Object.fromEntries(users.map((user) => [user.id, user])); /*incorrect library type*/
    generalUsersStore.update((existingUsers) => ({ ...existingUsers, ...newUsers }));
}

export async function loadAndSetAllUsers(): Promise<void> {
    try {
        const users = await loadUsers();
        addUsers(users);
    } catch (error) {
        console.log(error);
        console.log("Failed to load users");
    }
}

export async function loadAndSetUser(id: UserId) {
    try {
        const user = await loadUser(id);
        addUsers([user]);
    } catch (error) {
        console.log(error);
        console.log("Failed to load users");
    }
}