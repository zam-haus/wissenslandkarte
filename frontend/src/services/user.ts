import { CurrentUserDTO } from '../../../mock-backend/mocks/models/user';

export async function getCurrentUser(): Promise<CurrentUserDTO> {
    const response = await fetch('/api/users/me');
    const user: CurrentUserDTO = await response.json();

    return user;
}