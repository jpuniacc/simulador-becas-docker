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
})

describe('urlHasCampaignParams', () => {
  it('true con utm', () => {
    expect(urlHasCampaignParams('https://x.cl/?utm_source=a')).toBe(true)
  })

  it('false sin params', () => {
    expect(urlHasCampaignParams('https://x.cl/simulador')).toBe(false)
  })
})
