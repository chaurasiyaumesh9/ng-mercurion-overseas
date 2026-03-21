import { PlpQueryParams } from "@shopping/models/plp-query.model";

export function buildPlpParams(query: PlpQueryParams) {
  return {
    c: query.c ?? 'TSTDRV2206481',
    country: query.country ?? 'US',
    language: query.language ?? 'en',
    currency: query.currency ?? 'USD',
    fieldset: 'search',
    include: 'facets',
    use_pcv: 'F',
    limit: query.limit ?? 24,
    offset: query.offset ?? 0,
    sort: query.sort ?? 'commercecategory:desc',
    pricelevel: query.pricelevel ?? 5,
    matrixchilditems_fieldset: 'matrixchilditems_search',
    commercecategoryurl: query.commercecategoryurl,
    ...query
  };
}