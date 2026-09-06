# Sources — delivery

[Topic overview](README.md) · [All sources](../sources.md) · [Research library](../README.md)

Access date: 2026-09-06. Confidence is specific to the stated finding and setting. Source identifiers stay stable across the library; an abstract-only record does not imply full methods were inspected.

### H1 — Static hosting and repository plans

GitHub. *What is GitHub Pages?* Undated current documentation. [Overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Supports static HTML/CSS/JavaScript hosting, project URL structure, and public/private repository plan eligibility. Official page inspected.

### H2 — Multiple pages and publishing scope

GitHub. *Creating a GitHub Pages site*. Undated current documentation. [Guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Supports distinct URLs from directory structure and deployment of a selected build artifact. Official page inspected.

### H3 — Astro routing and authored content

Astro. *Pages* and *Markdown in Astro*. Undated current documentation. [Pages](https://docs.astro.build/en/basics/astro-pages/), [Markdown](https://docs.astro.build/en/guides/markdown-content/). Supports static page generation and Markdown-based content. Official documentation inspected; precise dependency versions remain an implementation decision.

### H4 — Astro deployment to Pages

Astro. *Deploy your Astro Site to GitHub Pages*. Undated current documentation. [Deployment guide](https://docs.astro.build/en/guides/deploy/github/). Supports GitHub Actions publishing and `site`/`base` configuration. Official page inspected. Recheck workflow versions when implementing.

### H5 — Prototype fidelity follows the question

GOV.UK Service Manual. *Making prototypes*. Published October 18, 2016; official guidance accessed September 6, 2026. [Guidance](https://www.gov.uk/service-manual/design/making-prototypes).

Supports using different prototype forms at different stages, and code to test realistic interactions. Confidence: high as an account of professional guidance, not experimental proof that one tool produces better aesthetics. Official page inspected. The ImageGen-to-HTML/SVG sequence is this project's recommendation, not a workflow prescribed by the source.

### H6 — Optional interaction animation

W3C WAI. *Understanding SC 2.3.3: Animation from Interactions*, WCAG 2.2 explanatory guidance, updated September 16, 2025; accessed September 6, 2026. [Official explanation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

Supports allowing nonessential interaction animation to be disabled, including reduced-motion preferences. This criterion is Level AAA; the page is informative guidance, not itself a conformance test. Confidence: high for the stated accessibility principle. Official page inspected. No still mockup establishes WCAG conformance or measures vestibular comfort.

### H7 — Tailwind theme and local build

Tailwind CSS. *Theme variables* and *Installing Tailwind CSS with Vite*. Current official documentation, accessed September 6, 2026. [Theme](https://tailwindcss.com/docs/theme), [Vite integration](https://tailwindcss.com/docs/installation/using-vite).

Supports shared design tokens mapped to utilities and a local Vite build integration. Official pages inspected. The choice to use Tailwind's scale to constrain this project's layout is a design decision; the tool does not guarantee consistent or beautiful results. Installed version compatibility and the actual build remain to be verified during implementation.

Vite's [server options](https://vite.dev/config/server-options#server-strictport) and [preview options](https://vite.dev/config/preview-options), inspected on the same date, document fixed ports and strict-port failure rather than automatic increment. The project's 4600–4699 restriction is an owner requirement and requires its own override guard; Vite defaults alone do not enforce a range.

### H8 — Canvas and semantic alternatives

MDN Web Docs. *Canvas API*. Current documentation, accessed September 6, 2026. [Guide](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

Documents Canvas 2D drawing and animation, and the need for accessible alternatives because drawn objects are not exposed like semantic HTML. Page inspected. Supports the Canvas-plus-HTML boundary in product document 008, not a claim that the unbuilt interface passes accessibility or performance testing.
