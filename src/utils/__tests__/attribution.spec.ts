import { describe, it, expect } from 'vitest'
import {
  parseUrlAttribution,
  resolveGoogleClickId,
  deriveTrafficType,
  deriveOrganicFromReferrer,
  enrichAttributionSnapshot,
  urlHasCampaignParams,
} from '../attribution'

describe('parseUrlAttribution', () => {
  it('parsea UTMs y _gcl_aw', () => {
    const url =
      'https://simulador.uniacc.cl/simulador?utm_source=google&gclid=ABC&_gcl_aw=GCL.test'
    expect(parseUrlAttribution(url)).toMatchObject({
      utm_source: 'google',
      gclid: 'ABC',
      gcl_aw: 'GCL.test',
    })
  })

  it('normaliza alias legacy adwords/ppc a la taxonomía Marketing', () => {
    expect(
      parseUrlAttribution('https://simulador.uniacc.cl/?utm_source=adwords&utm_medium=ppc')
    ).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
    })
  })

  it('lee campaign_id/adgroup_id/ad_id desde los alias ValueTrack hsa_*', () => {
    const url =
      'https://simulador.uniacc.cl/?utm_id=23980021855&hsa_grp=987&hsa_ad=654'
    expect(parseUrlAttribution(url)).toMatchObject({
      campaign_id: '23980021855',
      adgroup_id: '987',
      ad_id: '654',
    })
  })

  it('prefiere los nombres explícitos por sobre los alias hsa_*', () => {
    const url =
      'https://simulador.uniacc.cl/?campaign_id=111&utm_id=999&adgroup_id=222&hsa_grp=888'
    expect(parseUrlAttribution(url)).toMatchObject({
      campaign_id: '111',
      adgroup_id: '222',
    })
  })

  it('ignora ValueTrack vacíos en Demand Gen (utm_term, hsa_kw)', () => {
    const url =
      'https://simulador.uniacc.cl/?utm_source=google&utm_medium=demand_gen&utm_term=&hsa_kw=&hsa_grp='
    const result = parseUrlAttribution(url)
    expect(result.utm_term).toBeUndefined()
    expect(result.adgroup_id).toBeUndefined()
  })
})

describe('resolveGoogleClickId', () => {
  it('prefiere gclid sobre gcl_aw', () => {
    expect(resolveGoogleClickId({ gclid: 'A', gcl_aw: 'B' })).toBe('A')
  })

  it('usa gcl_aw si no hay gclid', () => {
    expect(resolveGoogleClickId({ gcl_aw: 'GCL.xxx' })).toBe('GCL.xxx')
  })
})

describe('deriveOrganicFromReferrer', () => {
  it('detecta Google orgánico', () => {
    expect(deriveOrganicFromReferrer('https://www.google.cl/search?q=uniacc')).toEqual({
      organic_source: 'google',
      organic_medium: 'organic',
    })
  })

  it('detecta referral genérico', () => {
    expect(deriveOrganicFromReferrer('https://www.uniacc.cl/carreras')).toEqual({
      organic_source: 'www.uniacc.cl',
      organic_medium: 'referral',
    })
  })
})

describe('deriveTrafficType', () => {
  it('paid por _gcl_aw', () => {
    expect(deriveTrafficType({ gcl_aw: 'GCL.xxx' })).toBe('paid')
  })

  it('organic por referrer google sin paid ids', () => {
    expect(
      deriveTrafficType({ referrer: 'https://www.google.com/search?q=test' })
    ).toBe('organic')
  })

  it('direct sin señales', () => {
    expect(deriveTrafficType({})).toBe('direct')
  })

  it('email por utm_medium', () => {
    expect(deriveTrafficType({ utm_medium: 'email', utm_source: 'newsletter' })).toBe('email')
  })

  it.each([
    ['google', 'cpc'],
    ['google', 'pmax'],
    ['google', 'demand_gen'],
    ['facebook', 'paid_social'],
    ['instagram', 'paid_social'],
    ['tiktok', 'paid_social'],
    ['youtube', 'paid_video'],
  ] as const)('paid por taxonomía Marketing %s/%s', (utm_source, utm_medium) => {
    expect(deriveTrafficType({ utm_source, utm_medium })).toBe('paid')
  })

  it.each([
    ['instagram', 'organic_social'],
    ['facebook', 'organic_social'],
    ['youtube', 'organic_video'],
  ] as const)('social por taxonomía Marketing %s/%s', (utm_source, utm_medium) => {
    expect(deriveTrafficType({ utm_source, utm_medium })).toBe('social')
  })

  it('paid con alias legacy adwords/ppc', () => {
    expect(deriveTrafficType({ utm_source: 'adwords', utm_medium: 'ppc' })).toBe('paid')
  })

  it('organic por google/organic', () => {
    expect(deriveTrafficType({ utm_source: 'google', utm_medium: 'organic' })).toBe('organic')
  })
})

describe('enrichAttributionSnapshot', () => {
  it('normaliza gclid desde gcl_aw y marca paid', () => {
    const result = enrichAttributionSnapshot({
      gcl_aw: 'GCL.from_aw',
      referrer: 'https://www.google.com/',
    })
    expect(result.gclid).toBe('GCL.from_aw')
    expect(result.traffic_type).toBe('paid')
  })

  it('conserva utm_source=youtube aunque llegue con gclid de Google Ads', () => {
    const result = enrichAttributionSnapshot({
      utm_source: 'youtube',
      utm_medium: 'paid_video',
      gclid: 'Cj0KCQtest',
    })
    expect(result.utm_source).toBe('youtube')
    expect(result.traffic_type).toBe('paid')
  })

  it('normaliza snapshots legacy guardados en localStorage', () => {
    const result = enrichAttributionSnapshot({
      utm_source: 'adwords',
      utm_medium: 'ppc',
    })
    expect(result.utm_source).toBe('google')
    expect(result.utm_medium).toBe('cpc')
    expect(result.traffic_type).toBe('paid')
  })

  it('persiste organic_* desde UTMs sociales orgánicos', () => {
    const result = enrichAttributionSnapshot({
      utm_source: 'instagram',
      utm_medium: 'organic_social',
    })
    expect(result.traffic_type).toBe('social')
    expect(result.organic_source).toBe('instagram')
    expect(result.organic_medium).toBe('organic_social')
  })
})

describe('deriveOrganicFromReferrer social taxonomy', () => {
  it('instagram → organic_social', () => {
    expect(deriveOrganicFromReferrer('https://www.instagram.com/p/abc')).toEqual({
      organic_source: 'instagram',
      organic_medium: 'organic_social',
    })
  })

  it('youtube → organic_video', () => {
    expect(deriveOrganicFromReferrer('https://www.youtube.com/watch?v=1')).toEqual({
      organic_source: 'youtube',
      organic_medium: 'organic_video',
    })
  })
})

describe('urlHasCampaignParams', () => {
  it('true con utm', () => {
    expect(urlHasCampaignParams('https://x.cl/?utm_source=a')).toBe(true)
  })

  it('false sin params', () => {
    expect(urlHasCampaignParams('https://x.cl/simulador')).toBe(false)
  })
})
