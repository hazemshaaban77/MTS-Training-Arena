/// <reference types="vite/client" />
// Portable URL routing: Sites serves /, GitHub Pages serves /MTS-Training-Arena/v6/.
// Keep session QR and projector links on the frontend origin, never on the API origin.
const configuredBase: string = import.meta.env.BASE_URL || '/';
export function siteBase(): string {
  const base = configuredBase.startsWith('/') ? configuredBase : '/' + configuredBase;
  return base.endsWith('/') ? base : base + '/';
}
export function siteUrl(view?:string, code?:string):string {
  const url = new URL(siteBase(), window.location.origin);
  if (view && view !== 'login') url.searchParams.set('view', view);
  if (code) url.searchParams.set('code', code);
  return url.toString();
}
export function siteAsset(path:string):string {
  if (/^https:\/\//i.test(path)) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return siteBase() + path.slice(1);
}
