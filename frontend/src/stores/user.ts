import { writable } from 'svelte/store';
import type { CurrentUserDTO } from '../../../mock-backend/mocks/models/user';

export const userStore = writable<CurrentUserDTO | null>();