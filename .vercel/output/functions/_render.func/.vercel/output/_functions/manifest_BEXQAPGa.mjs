import 'cookie';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CyMGphdj.mjs';
import 'es-module-lexer';
import { i as decodeKey } from './chunks/astro/server_DOUQBOW-.mjs';
import 'clsx';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/","adapterName":"@astrojs/vercel/serverless","routes":[{"file":"api/rewrite","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/rewrite","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/rewrite\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"rewrite","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/rewrite.ts","pathname":"/api/rewrite","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/stripe/checkout","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/stripe/checkout","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/stripe\\/checkout\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"stripe","dynamic":false,"spread":false}],[{"content":"checkout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/stripe/checkout.ts","pathname":"/api/stripe/checkout","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/stripe/portal","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/stripe/portal","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/stripe\\/portal\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"stripe","dynamic":false,"spread":false}],[{"content":"portal","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/stripe/portal.ts","pathname":"/api/stripe/portal","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/stripe/webhook","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/stripe/webhook","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/stripe\\/webhook\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"stripe","dynamic":false,"spread":false}],[{"content":"webhook","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/stripe/webhook.ts","pathname":"/api/stripe/webhook","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/usage","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/usage","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/usage\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"usage","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/usage.ts","pathname":"/api/usage","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"dashboard/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/dashboard","isIndex":false,"type":"page","pattern":"^\\/dashboard\\/?$","segments":[[{"content":"dashboard","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/dashboard.astro","pathname":"/dashboard","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"login/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"pricing/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/pricing","isIndex":false,"type":"page","pattern":"^\\/pricing\\/?$","segments":[[{"content":"pricing","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/pricing.astro","pathname":"/pricing","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"privacy/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/privacy","isIndex":false,"type":"page","pattern":"^\\/privacy\\/?$","segments":[[{"content":"privacy","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/privacy.astro","pathname":"/privacy","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"signup/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/signup","isIndex":false,"type":"page","pattern":"^\\/signup\\/?$","segments":[[{"content":"signup","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/signup.astro","pathname":"/signup","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://devoke.app","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/dashboard.astro",{"propagation":"none","containsHead":true}],["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/login.astro",{"propagation":"none","containsHead":true}],["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/pricing.astro",{"propagation":"none","containsHead":true}],["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/privacy.astro",{"propagation":"none","containsHead":true}],["C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/src/pages/signup.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:src/pages/api/rewrite@_@ts":"pages/api/rewrite.astro.mjs","\u0000@astro-page:src/pages/api/stripe/checkout@_@ts":"pages/api/stripe/checkout.astro.mjs","\u0000@astro-page:src/pages/api/stripe/portal@_@ts":"pages/api/stripe/portal.astro.mjs","\u0000@astro-page:src/pages/api/stripe/webhook@_@ts":"pages/api/stripe/webhook.astro.mjs","\u0000@astro-page:src/pages/api/usage@_@ts":"pages/api/usage.astro.mjs","\u0000@astro-page:src/pages/dashboard@_@astro":"pages/dashboard.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/pricing@_@astro":"pages/pricing.astro.mjs","\u0000@astro-page:src/pages/privacy@_@astro":"pages/privacy.astro.mjs","\u0000@astro-page:src/pages/signup@_@astro":"pages/signup.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","C:/Users/Matthew/Desktop/Claude/StillWater/devoke-site/node_modules/astro/dist/env/setup.js":"chunks/astro/env-setup_Cr6XTFvb.mjs","\u0000@astrojs-manifest":"manifest_BEXQAPGa.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.WmawwsMv.js","/astro/hoisted.js?q=1":"_astro/hoisted.DY_ldVcC.js","/astro/hoisted.js?q=2":"_astro/hoisted.BpuIvUd7.js","/astro/hoisted.js?q=3":"_astro/hoisted.BCY431Dk.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/index.Dyz_Sb6S.css","/favicon.svg","/robots.txt","/sitemap.xml","/_astro/hoisted.BCY431Dk.js","/_astro/hoisted.BpuIvUd7.js","/_astro/hoisted.DY_ldVcC.js","/_astro/hoisted.WmawwsMv.js","/api/rewrite","/api/stripe/checkout","/api/stripe/portal","/api/stripe/webhook","/api/usage","/dashboard/index.html","/login/index.html","/pricing/index.html","/privacy/index.html","/signup/index.html","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"k/o7XgHJQcv03n9kflSN2qCS1jGnLJzvwl/7axxz1lg=","experimentalEnvGetSecretEnabled":false});

export { manifest };
