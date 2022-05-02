import { writable } from 'svelte/store';

import type { ProjectDTO } from "../../../mock-backend/mocks/models/project";
import { loadProjects } from './api';

export const projectsStore = writable<{projects: ProjectDTO[], error: Error | null, loading: boolean}>({projects: [], error: null, loading: true});

export function setProjects(projects: ProjectDTO[]): void {
    projectsStore.update(() => ({error: null, projects, loading: false}));
}

export function setProjectsError(error: Error): void {
    projectsStore.update(() => ({projects: [], error, loading: false}));
}

export async function loadAndSetProjects(): Promise<void> {
    let projects: ProjectDTO[];
        
    try {
        projects = await loadProjects();
        setProjects(projects);
    } catch (error) {
        setProjectsError(error);
    }
}