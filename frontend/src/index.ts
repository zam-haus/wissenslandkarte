import App from './App.svelte';
import { setupI18n } from './services/i18n';
import { loadAndSetProjects } from './services/projectStore';
import { getCurrentUser } from "./services/user";
import { userStore } from "./stores/user";
import { loadAndSetUsers } from './stores/usersStore';

setupI18n();
loadAndSetProjects().catch((err) => console.error(err));
loadAndSetUsers();

getCurrentUser().then((user) => {
	userStore.set(user);
});

const app = new App({
	target: document.body
});

export default app;