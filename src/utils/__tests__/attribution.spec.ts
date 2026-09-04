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
