import { derived, writable, type Readable } from "svelte/store";
import type { UserDTO, UserId } from "../../../mock-backend/mocks/models/user";
import { addUser, addUsers, generalUsersStore, removeUser } from '../stores/generalUsersStore';
import { HttpError, loadUser, loadUsers, NetworkError } from "./api";

function loadAndSet<T>(
    loader: () => Promise<T>,
    addToStore: (loadedData: T) => void,
    removeFromStore: () => void = () => undefined
): Readable<HttpError | NetworkError> {
    const errorStore = writable<HttpError | NetworkError>();

    loader()
        .then((loadedUser) => addToStore(loadedUser))
        .catch((error) => {
            if (error instanceof HttpError) {
                if (error.errorCode == 404) {
                    removeFromStore();
                }
                errorStore.set(error);
            }
        });

    return { subscribe: errorStore.subscribe };
}

export function loadAndSetUser(userId: UserId): [Readable<UserDTO>, Readable<HttpError | NetworkError>] {
    const userStore = derived(generalUsersStore, (data) => data[userId]);
    const errorStore = loadAndSet(() => loadUser(userId), addUser, () => removeUser(userId));

    return [userStore, { subscribe: errorStore.subscribe }];
}

export function loadAndSetAllUsers(): [Readable<UserDTO[]>, Readable<HttpError | NetworkError>] {
    const userStore = derived(generalUsersStore, (data) => Object.values(data));
    const errorStore = loadAndSet(() => loadUsers(), addUsers);

    return [userStore, { subscribe: errorStore.subscribe }];
}
