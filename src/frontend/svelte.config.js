import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Use adapter-static for a pure CSR (client-side rendered) SPA.
		// All data is fetched at runtime via the API / WebSockets, so
		// there is no need for server-side rendering.
		// See https://svelte.dev/docs/kit/single-page-apps
		adapter: adapter({
			fallback: 'index.html'  // SPA fallback for client-side routing
		})
	}
};

export default config;
