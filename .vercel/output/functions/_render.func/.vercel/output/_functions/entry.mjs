import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_DrCFwpig.mjs';
import { manifest } from './manifest_BEXQAPGa.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/rewrite.astro.mjs');
const _page2 = () => import('./pages/api/stripe/checkout.astro.mjs');
const _page3 = () => import('./pages/api/stripe/portal.astro.mjs');
const _page4 = () => import('./pages/api/stripe/webhook.astro.mjs');
const _page5 = () => import('./pages/api/usage.astro.mjs');
const _page6 = () => import('./pages/dashboard.astro.mjs');
const _page7 = () => import('./pages/login.astro.mjs');
const _page8 = () => import('./pages/pricing.astro.mjs');
const _page9 = () => import('./pages/privacy.astro.mjs');
const _page10 = () => import('./pages/signup.astro.mjs');
const _page11 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/rewrite.ts", _page1],
    ["src/pages/api/stripe/checkout.ts", _page2],
    ["src/pages/api/stripe/portal.ts", _page3],
    ["src/pages/api/stripe/webhook.ts", _page4],
    ["src/pages/api/usage.ts", _page5],
    ["src/pages/dashboard.astro", _page6],
    ["src/pages/login.astro", _page7],
    ["src/pages/pricing.astro", _page8],
    ["src/pages/privacy.astro", _page9],
    ["src/pages/signup.astro", _page10],
    ["src/pages/index.astro", _page11]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "8e2d6ebb-1df1-49a0-b6e9-0f5ef2f3e29d",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
