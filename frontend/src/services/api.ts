import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
import type { UserDTO } from "../../../mock-backend/mocks/models/user";

export async function loadProjects(): Promise<ProjectDTO[]> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    let response: Response
    
    try {
        response = await fetch("/api/projects", {signal});
    } catch (err) {
        console.log(err);
        throw new Error('no response');
    }
    
    if (!response.ok) {
        throw new Error("could no load projects");
    }

    const projects = await response.json() as ProjectDTO[];

    return projects.map((p) => ({...p, creationDate: new Date(p.creationDate), latestModificationDate: new Date(p.latestModificationDate)}));
}

export async function loadUsers(): Promise<UserDTO[]> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    let response: Response
    
    try {
        response = await fetch("/api/users", {signal});
    } catch (err) {
        throw new Error('no response');
    }
    
    if (!response.ok) {
        throw new Error("could no load users");
    }

    const users = await response.json() as UserDTO[];

    return users;
}

