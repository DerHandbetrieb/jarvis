// Tests: Dauer-HUD in Wallpaper Engine einrichten (electron/wallpaper.cjs) – in einem Wegwerf-Ordner (03.11.2026)
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const { bibliotheken, findeWallpaperEngine, einrichten, zugangAbgleichen } = createRequire(import.meta.url)('./wallpaper.cjs')

describe('Dauer-HUD in Wallpaper Engine', () => {
  it('liest die Steam-Bibliotheken', () => {
    const vdf = '"libraryfolders"\n{\n "0"\n {\n  "path"  "C:\\\\Program Files (x86)\\\\Steam"\n }\n "1"\n {\n  "path"  "D:\\\\GAMES\\\\Steam"\n }\n}'
    expect(bibliotheken(vdf, 'C:\\Program Files (x86)\\Steam')).toEqual([path.normalize('C:\\Program Files (x86)\\Steam'), path.normalize('D:\\GAMES\\Steam')])
  })
  it('findet Wallpaper Engine in einer weiteren Bibliothek, sonst null', () => {
    const wurzel = fs.mkdtempSync(path.join(os.tmpdir(), 'we-'))
    const steam = path.join(wurzel, 'steam'), bib = path.join(wurzel, 'spiele')
    fs.mkdirSync(path.join(steam, 'steamapps'), { recursive: true })
    fs.writeFileSync(path.join(steam, 'steamapps', 'libraryfolders.vdf'), `"path" "${bib.replace(/\\/g, '\\\\')}"`)
    const we = path.join(bib, 'steamapps', 'common', 'wallpaper_engine'); fs.mkdirSync(we, { recursive: true }); fs.writeFileSync(path.join(we, 'wallpaper32.exe'), '')
    expect(findeWallpaperEngine({ fs, leseSteamPfad: () => steam })).toBe(path.normalize(we))
    expect(findeWallpaperEngine({ fs, leseSteamPfad: () => null })).toBeNull()
    expect(findeWallpaperEngine({ fs, leseSteamPfad: () => path.join(wurzel, 'gibtsnicht') })).toBeNull()
  })
  it('legt das Projekt mit Zugang und project.json an und aktualisiert ohne vorher zu löschen (laufendes Wallpaper)', () => {
    const wurzel = fs.mkdtempSync(path.join(os.tmpdir(), 'we-'))
    const quelle = path.join(wurzel, 'dist-hud'); fs.mkdirSync(path.join(quelle, 'assets'), { recursive: true })
    fs.writeFileSync(path.join(quelle, 'dauer-hud.html'), '<html></html>'); fs.writeFileSync(path.join(quelle, 'assets', 'a.js'), '//')
    const fremd = path.join(wurzel, 'we', 'projects', 'myprojects', 'anderes'); fs.mkdirSync(fremd, { recursive: true }); fs.writeFileSync(path.join(fremd, 'x'), '1')
    const ziel = einrichten({ fs, we: path.join(wurzel, 'we'), quelle, port: 47820, schluessel: 'abc' })
    expect(JSON.parse(fs.readFileSync(path.join(ziel, 'project.json'), 'utf8'))).toMatchObject({ file: 'dauer-hud.html', type: 'web' })
    expect(fs.readFileSync(path.join(ziel, 'zugang.js'), 'utf8')).toContain('"schluessel":"abc"')
    expect(fs.existsSync(path.join(ziel, 'assets', 'a.js'))).toBe(true)
    fs.writeFileSync(path.join(ziel, 'assets', 'alt-123.js'), 'alt') // veralteter Programmteil
    einrichten({ fs, we: path.join(wurzel, 'we'), quelle, port: 47820, schluessel: 'neu' })
    expect(fs.existsSync(path.join(ziel, 'assets', 'alt-123.js'))).toBe(false)
    expect(fs.readFileSync(path.join(ziel, 'zugang.js'), 'utf8')).toContain('"schluessel":"neu"')
    expect(fs.readFileSync(path.join(fremd, 'x'), 'utf8')).toBe('1') // fremde Projekte bleiben unberührt
  })
  it('gleicht beim Start nur den Schlüssel im vorhandenen Projekt ab, legt nichts neu an', () => {
    const we = fs.mkdtempSync(path.join(os.tmpdir(), 'we-'))
    expect(zugangAbgleichen({ fs, we, port: 47820, schluessel: 'a' })).toBe('kein Projekt')
    expect(fs.existsSync(path.join(we, 'projects'))).toBe(false)
    const ziel = path.join(we, 'projects', 'myprojects', 'loki-dauer-hud'); fs.mkdirSync(ziel, { recursive: true })
    fs.writeFileSync(path.join(ziel, 'project.json'), '{}'); fs.writeFileSync(path.join(ziel, 'zugang.js'), 'window.LOKI_HUD = {"port":47820,"schluessel":"alt"}\n')
    expect(zugangAbgleichen({ fs, we, port: 47820, schluessel: 'neu' })).toBe('erneuert')
    expect(fs.readFileSync(path.join(ziel, 'zugang.js'), 'utf8')).toContain('"schluessel":"neu"')
    expect(zugangAbgleichen({ fs, we, port: 47820, schluessel: 'neu' })).toBe('aktuell')
  })
})
