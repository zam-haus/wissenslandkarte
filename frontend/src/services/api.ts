import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
import type { UserDTO } from "../../../mock-backend/mocks/models/user";

type UserId = UserDTO['id'];

const endpoints = {
    allProjects: () => `/api/projects`,
    allUsers: () => `/api/users`,
    singleUser: (id: UserId) => `/api/users/${id}`,
}

export class NetworkError extends Error {
    constructor(
        message: string,
        public reason: any,
    ) {
        super(message);
    }
}

export class HttpError extends Error {
    constructor(
        message: string,
        public errorCode: number,
        public errorText: string,
    ) {
        super(message);
    }
}

async function loadFromEndpoint<T>(endpoint: string): Promise<T> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    let response: Response

    try {
        response = await fetch(endpoint, { signal });
    } catch (err) {
        console.log(err);
        throw new NetworkError(`no response loading ${endpoint}`, err);
    }

    if (!response.ok) {
        throw new HttpError(`error loading ${endpoint}: ${response.status} ${response.statusText}`, response.status, response.statusText);
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