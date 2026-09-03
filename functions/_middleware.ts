const spaHandler = async ({ request, next, env }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // If the path looks like a file with extension, let it pass through to static assets
  if (pathname.match(/\/[^\/]+\.[a-zA-Z0-9]+(\?.*)?$/)) {
    return next();
  }

  // For SPA routes (no file extension), serve index.html
  return env.ASSETS.fetch(`${url.origin}/index.html`);
};

export const onRequest = [spaHandler];