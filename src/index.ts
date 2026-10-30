interface Env {
    ASSETS: {
        fetch(request: Request): Promise<Response>;
    };
}

const routeAssets: Record<string, string> = {
    "/": "/views/",
    "/about": "/views/about",
    "/resume": "/static/Gavin Collier - Resume.pdf",
    "/masquerade/herald": "/views/lostMasquerade/heraldSkillTree",
    "/masquerade/herald/skilltree.json": "/static/JSON/skillTree.json",
};

const staticDirectories = ["/static", "/views", "/scripts"];

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method !== "GET" && request.method !== "HEAD") {
            return Response.redirect(new URL("/", request.url), 302);
        }

        const url = new URL(request.url);
        const pathname = url.pathname.replace(/\/+$/, "") || "/";
        const routeAsset = routeAssets[pathname];
        const assetPaths = routeAsset
            ? [routeAsset]
            : staticDirectories.map((directory) => `${directory}${pathname}`);

        for (const assetPath of assetPaths) {
            url.pathname = assetPath;
            const response = await env.ASSETS.fetch(new Request(url, request));

            if (response.status !== 404) {
                if (pathname === "/resume") {
                    const headers = new Headers(response.headers);
                    headers.set(
                        "Content-Disposition",
                        'attachment; filename="Gavin Collier - Resume.pdf"',
                    );
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers,
                    });
                }

                return response;
            }
        }

        return Response.redirect(new URL("/", request.url), 302);
    },
};
