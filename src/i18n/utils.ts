import { ui, defaultLang, type Lang, languages } from './ui';

const SUPPORTED = Object.keys(languages) as Lang[];

export function isLang(value: string | undefined): value is Lang {
  return !!value && (SUPPORTED as string[]).includes(value);
}

/** Extract the locale prefix from a URL, e.g. /th/rooms → 'th'. */
export function getLangFromUrl(url: URL): Lang {
  const [, maybe] = url.pathname.split('/');
  return isLang(maybe) ? maybe : defaultLang;
}

/** Strip the locale prefix to get the "bare" path used for switching languages. */
export function getRouteFromUrl(url: URL): string {
  const [, maybe, ...rest] = url.pathname.split('/');
  if (isLang(maybe)) return '/' + rest.join('/');
  return url.pathname;
}

type Dict = Record<string, unknown>;

function lookup(dict: Dict | undefined, path: string): unknown {
  if (!dict) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Dict)) {
      return (acc as Dict)[key];
    }
    return undefined;
  }, dict);
}

/**
 * Translator factory. Resolves keys against the requested locale first,
 * then falls back to the default locale. Returns the key itself if missing
 * in both — handy for spotting unset strings during dev.
 */
export function useT(lang: Lang) {
  return function t<T = string>(path: string): T {
    const got = lookup(ui[lang] as Dict, path);
    if (got !== undefined) return got as T;
    const fb = lookup(ui[defaultLang] as Dict, path);
    if (fb !== undefined) return fb as T;
    return path as unknown as T;
  };
}

/** Build a locale-prefixed href, e.g. localizedHref('/rooms', 'th') → '/th/rooms'. */
export function localizedHref(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return `/${lang}${clean === '/' ? '' : clean}`;
}

export { defaultLang, languages };
export type { Lang };
