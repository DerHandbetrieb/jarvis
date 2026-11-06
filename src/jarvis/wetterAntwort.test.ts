// Tests: Wetterfragen nur aus den Messwerten der Station (wetterAntwort.ts), 06.11.2026
import { describe, expect, it } from 'vitest'
import { istWetterFrage, wetterAntwort } from './wetterAntwort'
import { wetterAusCode, WETTER_WORT } from './wetter'

const w = { grad: 7, code: 0, wolken: null, feuchte: 71, wind: 6.8, boe: 9.4, regenRate: 0, regenHeute: 0 }

describe('Wetterfragen erkennen', () => {
  it.each(['Wie wird das Wetter?', 'Regnet es gerade?', 'Scheint die Sonne?', 'Wie viel Grad haben wir?', 'Ist es windig?', 'Wie kalt ist es draußen', 'Schneit es?', 'Ist es bewölkt?', 'Ist es kalt', 'Ist es heute warm', 'Hat es geregnet', 'Hat es geschneit', 'Regnets', 'Wie hoch ist der Luftdruck', 'Wie ist die Windgeschwindigkeit', 'Friert es', 'Gibt es Frost', 'Brauche ich eine Jacke', 'Brauche ich einen Schirm', 'Was sagt meine Wetterstation', 'Wie warm ist es heute', 'Scheint heute die Sonne', 'Wie viel Wind heute', 'Gibt es Gewitter', 'Ist es neblig'])('%s', (f) => {
    expect(istWetterFrage(f)).toBe(true)
  })
  it.each(['Was machst du am Sonntag?', 'Hast du eine Anregung?', 'Wie läuft Windows?', 'Guten Morgen, wie geht es dir?', 'Erzähl mir einen Witz', 'Bist du böse', 'Wie steht die Börse', 'Wie viel Grad hat die Grafikkarte', 'Wie ist die Temperatur der Grafikkarte', 'Wie warm ist mein Kaffee', 'Emma ist draußen', 'Ich gehe kurz nach draußen', 'Kennst du Schneewittchen', 'Regensburg ist schön', 'Mein Akku muss sich regenerieren', 'Wie weit ist die Sonne entfernt', 'Ach du lieber Himmel', 'bis zu einem gewissen Grad', 'Erzähl einen Witz über das Wetter'])('%s', (f) => {
    expect(istWetterFrage(f)).toBe(false)
  })
})

describe('Wetterantwort', () => {
  it('nennt nur Messwerte', () => {
    expect(wetterAntwort('Wie ist das Wetter?', w, 'Sir')).toEqual(['Draußen sind es 7 Grad und Sonnenschein.'])
  })
  it('sagt ohne Station ehrlich, dass nichts da ist', () => {
    expect(wetterAntwort('Regnet es?', null, 'Sir').join(' ')).toContain('keine frischen Werte')
  })
  it('kennt keine Zukunft', () => {
    expect(wetterAntwort('Regnet es morgen?', w, 'Sir')[0]).toContain('Vorhersagen habe ich keine')
  })
  it('„heute Morgen“ und ein Morgengruß sind keine Fragen nach morgen', () => {
    expect(wetterAntwort('Wie kalt war es heute Morgen', w, 'Sir')[0]).toContain('Was vorhin war')
    expect(wetterAntwort('Morgen Loki, wie ist das Wetter', w, 'Sir')[0]).toBe('Draußen sind es 7 Grad und Sonnenschein.')
    expect(wetterAntwort('Guten Morgen, wie ist das Wetter', w, 'Sir')[0]).toBe('Draußen sind es 7 Grad und Sonnenschein.')
  })
  it('heutige Frage nach der Zukunft bekommt den Hinweis', () => {
    expect(wetterAntwort('Wie wird das Wetter heute', w, 'Sir')[0]).toContain('Vorhersagen habe ich keine')
    expect(wetterAntwort('Regnet es heute noch', w, 'Sir')[0]).toContain('Vorhersagen habe ich keine')
  })
  it('gestern kennt er nicht', () => {
    expect(wetterAntwort('Wie viel Regen gestern', w, 'Sir')[0]).toContain('Was vorhin war')
  })
  it('Regen heute aus der Tagessumme', () => {
    expect(wetterAntwort('Hat es geregnet', w, 'Sir').join(' ')).toContain('Heute ist bisher nichts gefallen')
    expect(wetterAntwort('Hat es heute geregnet', { ...w, regenHeute: 1.2 }, 'Sir').join(' ')).toContain('1,2 Millimeter gefallen')
  })
  it('sagt, was die Station nicht erkennt', () => {
    expect(wetterAntwort('Gibt es Gewitter', w, 'Sir').join(' ')).toContain('kann die Station nicht erkennen')
  })
  it('nennt den Luftdruck', () => {
    expect(wetterAntwort('Wie hoch ist der Luftdruck', { ...w, druck: 976.6 }, 'Sir').join(' ')).toContain('977 Hektopascal')
  })
  it('beantwortet Regen aus der Messung', () => {
    expect(wetterAntwort('Regnet es?', w, 'Sir').join(' ')).toContain('Niederschlag misst die Station gerade nicht')
    expect(wetterAntwort('Regnet es?', { ...w, code: 63, regenRate: 3.5, regenHeute: 2.1 }, 'Sir').join(' ')).toContain('3,5 Millimeter pro Stunde')
  })
  it('behauptet nachts nichts über den Himmel', () => {
    const s = wetterAntwort('Sind Wolken am Himmel?', { ...w, code: null }, 'Sir')
    expect(s[0]).toBe('Draußen sind es 7 Grad.')
    expect(s[1]).toContain('nicht messen')
  })
  it('spricht Minusgrade aus', () => {
    expect(wetterAntwort('Wie viel Grad?', { ...w, grad: -3.4, code: null }, 'Sir')[0]).toBe('Draußen sind es minus 3 Grad.')
  })
  it('nennt Wind und Feuchte nur auf Nachfrage', () => {
    expect(wetterAntwort('Ist es windig?', w, 'Sir').join(' ')).toContain('6,8 Kilometern pro Stunde, in Böen mit 9,4')
    expect(wetterAntwort('Wie hoch ist die Luftfeuchte?', w, 'Sir').join(' ')).toContain('71 Prozent')
  })
})

describe('Worte passen zum Code', () => {
  it('heiter und bewölkt sind getrennt', () => {
    expect(WETTER_WORT[wetterAusCode(0)]).toBe('Sonnenschein')
    expect(WETTER_WORT[wetterAusCode(1)]).toBe('Sonnenschein')
    expect(WETTER_WORT[wetterAusCode(2)]).toBe('heiter')
    expect(WETTER_WORT[wetterAusCode(3)]).toBe('bewölkt')
    expect(WETTER_WORT[wetterAusCode(71)]).toBe('Schnee')
  })
})
