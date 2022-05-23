import { writable } from 'svelte/store';
import { UserDTO } from '../../../mock-backend/mocks/models/user';
import { loadUsers } from '../services/api';


export const usersStore = writable<UserDTO[] | null>();

export function setUsers(users: UserDTO[]): void {
    usersStore.update(() => users);
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
