# NAUTICALUS — Where the Ocean Makes Its Own Light

An immersive, single-page voyage from the moonlit ocean surface to the Challenger Deep. Built with React, Vite, Canvas 2D and Web Audio, with interactive creatures, sonar, bioluminescence and a field log.

## Local development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Automatic deployment to Cloudflare Workers

This repository is prepared for **Cloudflare Workers static assets** through `wrangler.jsonc`. No Worker backend, database, environment secrets or Cloudflare API token in GitHub are required.

1. In Cloudflare select **Workers & Pages → Create application → GitHub**.
2. Allow access to the private repository `mistyislesoftware/nauticalus` when prompted.
3. Choose branch `main`, Worker name **nauticalus**, project root `/`.
4. Set **Build command** to `npm run build` and **Deploy command** to `npx wrangler deploy`.
5. Select **Save and Deploy**. Verify the `workers.dev` preview.
6. In the Worker, select **Settings → Domains & Routes → Add → Custom Domain** and enter `nauticalus.mistyislesoftware.co.uk`.

Subsequent commits to `main` deploy automatically through Cloudflare Builds. The custom domain requires the domain to be on the same Cloudflare account.

## Notes

- All graphics and sounds are generated in the visitor's browser; no remote API or server database is needed.
- The main application is maintained in `src/Nauticalus.jsx`.
- Scientific descriptions should be independently fact-checked before being presented as authoritative educational material.
