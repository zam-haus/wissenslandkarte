import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
import type { UserDTO } from "../../../mock-backend/mocks/models/user";

type UserId = UserDTO['id'];

const endpoints = {
    allProjects: () => `/api/projects`,
    allUsers: () => `/api/users`,
    singleUser: (id: UserId) => `/api/users/${id}`,
}

async function loadFromEndpoint<T>(endpoint: string): Promise<T> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    let response: Response

    try {
        response = await fetch(endpoint, { signal });
    } catch (err) {
        console.log(err);
        throw new Error(`no response loading ${endpoint}`);
    }

    if (!response.ok) {
        throw new Error(`error loading ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export async function loadProjects(): Promise<ProjectDTO[]> {
    const projects = await loadFromEndpoint<ProjectDTO[]>(endpoints.allProjects());

    return projects.map((p) => ({
        ...p,
        creationDate: new Date(p.creationDate),
        latestModificationDate: new Date(p.latestModificationDate)
    }));
}

export async function loadUsers(): Promise<UserDTO[]> {
    return loadFromEndpoint(endpoints.allUsers());
}

export async function loadUser(id: UserId): Promise<UserDTO> {
    return loadFromEndpoint(endpoints.singleUser(id));
}