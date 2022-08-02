import App from './App.svelte';
import { setupI18n } from './services/i18n';
import { getCurrentUser } from "./services/user";
import { loadAndSetAllUsers } from './stores/generalUsersStore';
import { loggedInUserStore } from "./stores/loggedInUserStore";
import { loadAndSetProjects } from './stores/projectStore';

setupI18n();
loadAndSetProjects().catch((err) => console.error(err));
loadAndSetAllUsers();

getCurrentUser().then((user) => {
	loggedInUserStore.set(user);
});

const app = new App({
	target: document.body
});

export default app;