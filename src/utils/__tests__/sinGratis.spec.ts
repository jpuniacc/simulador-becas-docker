import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()
const PATRON = /gratis|gratuit/i
const EXCLUIDOS = ['sinGratis.spec.ts', 'supabase.ts']

const archivos = (dir: string, exts: string[]): string[] =>
  readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivos(ruta, exts)
    return exts.some((e) => nombre.endsWith(e)) && !EXCLUIDOS.includes(nombre) ? [ruta] : []
  })

describe('sin «gratis/gratuito» (observación normativa)', () => {
  it('index.html (metas) no menciona gratis', () => {
    expect(readFileSync(join(RAIZ, 'index.html'), 'utf8')).not.toMatch(PATRON)
  })

  it('ningún archivo de src/ ni public/ lo menciona', () => {
    const rutas = [
      ...archivos(join(RAIZ, 'src'), ['.ts', '.vue', '.html']),
      ...archivos(join(RAIZ, 'public'), ['.xml', '.txt', '.html', '.json'])
    ]
    const con = rutas.filter((r) => PATRON.test(readFileSync(r, 'utf8'))).map((r) => relative(RAIZ, r))
    expect(con).toEqual([])
  })
})
