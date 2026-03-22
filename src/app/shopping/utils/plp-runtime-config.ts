interface ScConfiguration {
  defaultSearchUrl?: string;
  resultsPerPage?: Array<{ items?: number | string; isDefault?: boolean }>;
  sortOptions?: Array<{ id?: string; name?: string; isDefault?: boolean }>;
  itemsDisplayOptions?: Array<{ id?: string; isDefault?: boolean }>;
  facets?: Array<{ id?: string; url?: string; isParameter?: boolean }>;
  facetsAsUrlParameters?: boolean;
  facetDelimiters?: {
    betweenFacetNameAndValue?: string;
    betweenDifferentFacets?: string;
    betweenDifferentFacetsValues?: string;
    betweenRangeFacetsValues?: string;
    betweenFacetsAndOptions?: string;
    betweenOptionNameAndValue?: string;
    betweenDifferentOptions?: string;
  };
  facetsSeoLimits?: unknown;
  siteSettings?: {
    facetfield?: Array<{
      facetfieldid?: string;
      urlcomponent?: string;
      urlcomponentaliases?: Array<{ urlcomponent?: string }>;
    }>;
  };
}

interface TranslatorConfig {
  fallbackUrl: string;
  defaultShow: number;
  defaultOrder: string;
  defaultDisplay: string;
  facets: Array<{ id?: string; url?: string; isParameter?: boolean }>;
  facetsAsUrlParameters: boolean;
  facetDelimiters: {
    betweenFacetNameAndValue: string;
    betweenDifferentFacets: string;
    betweenDifferentFacetsValues: string;
    betweenRangeFacetsValues: string;
    betweenFacetsAndOptions: string;
    betweenOptionNameAndValue: string;
    betweenDifferentOptions: string;
  };
  facetsSeoLimits: unknown;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getDefaultFromList<T>(
  list: T[],
  isDefault: (value: T) => boolean,
  fallback: T | undefined,
): T | undefined {
  return list.find(isDefault) ?? fallback;
}

export function getScConfiguration(): ScConfiguration {
  return ((globalThis as any).SC?.CONFIGURATION ?? {}) as ScConfiguration;
}

export function getTranslatorConfig(): TranslatorConfig {
  const config = getScConfiguration();
  const resultsPerPage = asArray<{ items?: number | string; isDefault?: boolean }>(
    config.resultsPerPage,
  );
  const sortOptions = asArray<{ id?: string; name?: string; isDefault?: boolean }>(config.sortOptions);
  const displayOptions = asArray<{ id?: string; isDefault?: boolean }>(config.itemsDisplayOptions);

  const defaultShow =
    Number(
      getDefaultFromList(
        resultsPerPage,
        (option) => !!option?.isDefault,
        resultsPerPage[0],
      )?.items ?? 12,
    ) || 12;

  const defaultOrder =
    getDefaultFromList(sortOptions, (option) => !!option?.isDefault, sortOptions[0])?.id ??
    'commercecategory:desc';

  const defaultDisplay =
    getDefaultFromList(displayOptions, (option) => !!option?.isDefault, displayOptions[0])?.id ??
    'grid';

  return {
    fallbackUrl: config.defaultSearchUrl ?? 'search',
    defaultShow,
    defaultOrder,
    defaultDisplay,
    facets: asArray(config.facets),
    facetsAsUrlParameters: !!config.facetsAsUrlParameters,
    facetDelimiters: {
      betweenFacetNameAndValue: config.facetDelimiters?.betweenFacetNameAndValue ?? '/',
      betweenDifferentFacets: config.facetDelimiters?.betweenDifferentFacets ?? '/',
      betweenDifferentFacetsValues: config.facetDelimiters?.betweenDifferentFacetsValues ?? ',',
      betweenRangeFacetsValues: config.facetDelimiters?.betweenRangeFacetsValues ?? 'to',
      betweenFacetsAndOptions: config.facetDelimiters?.betweenFacetsAndOptions ?? '?',
      betweenOptionNameAndValue: config.facetDelimiters?.betweenOptionNameAndValue ?? '=',
      betweenDifferentOptions: config.facetDelimiters?.betweenDifferentOptions ?? '&',
    },
    facetsSeoLimits: config.facetsSeoLimits,
  };
}

export function getFacetsToInclude(): string[] {
  const config = getScConfiguration();
  const facetfield = asArray<{
    facetfieldid?: string;
    urlcomponent?: string;
    urlcomponentaliases?: Array<{ urlcomponent?: string }>;
  }>(config.siteSettings?.facetfield);

  const fromSiteSettings = facetfield.flatMap((facet) => {
    if (!facet?.facetfieldid || facet.facetfieldid === 'commercecategory') return [];
    const aliases = asArray<{ urlcomponent?: string }>(facet.urlcomponentaliases)
      .map((alias) => alias?.urlcomponent)
      .filter((value): value is string => !!value);
    return [facet.facetfieldid, facet.urlcomponent, ...aliases].filter(
      (value): value is string => !!value,
    );
  });

  const fromFacetsConfig = asArray<{ id?: string; url?: string }>(config.facets).flatMap((facet) =>
    [facet?.id, facet?.url].filter((value): value is string => !!value),
  );

  return Array.from(new Set([...fromSiteSettings, ...fromFacetsConfig]));
}

export function getConfiguredSortOptions(): Array<{ id: string; name: string }> {
  const config = getScConfiguration();
  const options = asArray<{ id?: string; name?: string }>(config.sortOptions)
    .map((option) => ({
      id: option?.id ?? '',
      name: option?.name ?? option?.id ?? '',
    }))
    .filter((option) => !!option.id && !!option.name);

  if (options.length) return options;

  return [{ id: 'commercecategory:desc', name: 'Newest' }];
}

