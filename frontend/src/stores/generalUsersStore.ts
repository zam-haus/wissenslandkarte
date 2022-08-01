import { writable } from 'svelte/store';
import type { UserDTO } from '../../../mock-backend/mocks/models/user';
import { loadUsers } from '../services/api';


export const generalUsersStore = writable<UserDTO[] | null>();

export function setUsers(users: UserDTO[]): void {
    generalUsersStore.update(() => users);
}

export async function loadAndSetUsers(): Promise<void> {
    let users: UserDTO[];

    try {
        users = await loadUsers();
        setUsers(users);
    } catch (error) {
        console.log(error);
        console.log("Failed to load users");
    }
}
