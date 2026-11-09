// Windows-Lautstärke fürs Audiofeld des Dauer-HUD (09.11.2026, Wunsch Auftraggeber: schnell lauter/leiser). Liest und setzt
// die Hauptlautstärke des Standard-Ausgabegeräts über die Windows-Schnittstelle IAudioEndpointVolume; Werte 0..1 entsprechen
// der Stellung des Windows-Reglers (learn.microsoft.com/windows/win32/api/endpointvolume/nf-endpointvolume-iaudioendpointvolume-setmastervolumelevelscalar).
// Ein PowerShell-Programm bleibt offen: je Zeile „?“ (lesen) oder 0..100 (setzen), Antwort je Zeile „<wert> <stumm 0|1>“ oder „F“.
// Das Gerät wird je Auftrag neu geholt, damit ein Wechsel (Kopfhörer/Lautsprecher) sofort gilt. Wie der Windows-Regler hebt
// Lauterstellen eine Stummschaltung auf. Mehr kann das Programm nicht: nur diese eine Lautstärke.
const { spawn } = require('node:child_process')

const CSHARP = `using System; using System.Runtime.InteropServices;
namespace Loki {
[ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IEndpoint {
  int A1(); int A2(); int A3(out uint c);
  int A4(float l, ref Guid g);
  int SetScalar(float l, ref Guid g);
  int A5(out float l);
  int GetScalar(out float l);
  int A6(uint c, float l, ref Guid g); int A7(uint c, float l, ref Guid g); int A8(uint c, out float l); int A9(uint c, out float l);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool m, ref Guid g);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool m);
}
[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IGeraet { int Activate(ref Guid id, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); }
[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IListe { int A1(); int Standard(int fluss, int rolle, out IGeraet d); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class Liste {}
public static class Laut {
  static void Frei(object o) { if (o != null) Marshal.ReleaseComObject(o); }
  static IEndpoint Holen() {
    object l = new Liste(); IGeraet d = null; object o = null;
    try {
      Marshal.ThrowExceptionForHR(((IListe)l).Standard(0, 1, out d));
      Guid id = typeof(IEndpoint).GUID; Marshal.ThrowExceptionForHR(d.Activate(ref id, 1, IntPtr.Zero, out o));
      return (IEndpoint)o;
    } finally { Frei(d); Frei(l); }
  }
  static string Stand(IEndpoint e) { float l; bool m; Marshal.ThrowExceptionForHR(e.GetScalar(out l)); Marshal.ThrowExceptionForHR(e.GetMute(out m)); return ((int)Math.Round(l * 100)) + " " + (m ? 1 : 0); }
  public static string Lesen() { IEndpoint e = Holen(); try { return Stand(e); } finally { Frei(e); } }
  public static string Setzen(int n) {
    IEndpoint e = Holen(); Guid g = Guid.Empty; bool m;
    try {
      Marshal.ThrowExceptionForHR(e.SetScalar(n / 100f, ref g));
      Marshal.ThrowExceptionForHR(e.GetMute(out m)); if (m && n > 0) Marshal.ThrowExceptionForHR(e.SetMute(false, ref g));
      return Stand(e);
    } finally { Frei(e); }
  }
}}`
const SKRIPT = `Add-Type -TypeDefinition '${CSHARP}'
while ($true) { $z = [Console]::In.ReadLine(); if ($z -eq $null) { exit }; $n = 0; try { if ($z -eq '?') { [Console]::Out.WriteLine([Loki.Laut]::Lesen()) } elseif ([int]::TryParse($z, [ref]$n) -and $n -ge 0 -and $n -le 100) { [Console]::Out.WriteLine([Loki.Laut]::Setzen($n)) } else { [Console]::Out.WriteLine('F') } } catch { [Console]::Out.WriteLine('F') } }`

/** @param {{ starte?: typeof spawn, protokoll?: (...a: any[]) => void, zeitgrenze?: number }} o */
function erstelleLautstaerke({ starte = spawn, protokoll = () => {}, zeitgrenze = 1500 } = {}) {
  let p = null, rest = '', warten = [], letzter = null, ueberzogen = 0

  function allesLoesen() { for (const w of warten.splice(0)) w(letzter) }
  function zeile(z) {
    ueberzogen = 0
    const m = /^(\d{1,3}) ([01])$/.exec(z.trim())
    if (m) letzter = { wert: Math.min(100, Number(m[1])), stumm: m[2] === '1' }
    warten.shift()?.(m ? letzter : null) // Antworten kommen in Reihenfolge der Aufträge
  }
  function prozess() {
    if (p && !p.killed && p.exitCode == null) return p
    const q = starte('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SKRIPT], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    p = q; rest = ''
    q.on('error', (f) => { protokoll('Lautstärke: Start fehlgeschlagen', f?.message ?? f); if (p === q) { p = null; allesLoesen() } })
    q.on('exit', () => { if (p === q) { p = null; allesLoesen() } })
    q.stderr?.on('data', (d) => protokoll('Lautstärke:', String(d).slice(0, 200)))
    q.stdin?.on?.('error', (f) => protokoll('Lautstärke:', f?.message ?? f)) // Programm eben beendet: nicht als Absturz melden (Prüf-Agent)
    q.stdout?.on('data', (d) => {
      if (p !== q) return
      rest += String(d)
      let i; while ((i = rest.indexOf('\n')) >= 0) { zeile(rest.slice(0, i)); rest = rest.slice(i + 1) }
    })
    return q
  }
  /** hängt das Programm, wird es beendet; der nächste Auftrag startet es neu (Prüf-Agent) */
  function neuAnfangen() {
    protokoll('Lautstärke: Programm antwortet nicht, wird neu gestartet')
    const q = p; p = null; ueberzogen = 0
    try { q?.stdin?.end(); q?.kill() } catch { /* schon weg */ }
    allesLoesen()
  }
  /** Auftrag schicken; nach der Zeitgrenze kommt beiZeit zurück. Die späte Antwort bleibt in der Warteschlange eingeplant,
   *  damit die Reihenfolge stimmt. Nach drei Zeitüberschreitungen in Folge: neu anfangen. */
  function auftrag(zeileText, beiZeit = () => letzter) {
    return new Promise((fertig) => {
      let q
      try { q = prozess() } catch (f) { protokoll('Lautstärke:', f?.message ?? f); return fertig(beiZeit()) }
      if (!q?.stdin?.writable) return fertig(beiZeit())
      let erledigt = false
      const uhr = setTimeout(() => { erledigt = true; fertig(beiZeit()); if (++ueberzogen >= 3) neuAnfangen() }, zeitgrenze)
      warten.push((w) => { clearTimeout(uhr); if (!erledigt) { erledigt = true; fertig(w) } })
      q.stdin.write(`${zeileText}\n`)
    })
  }
  /** → { wert: 0..100, stumm } oder null (noch nichts bekannt) */
  const lesen = () => auftrag('?')
  /** n: ganze Zahl 0..100, alles andere wird abgelehnt; ohne Antwort null, damit niemand einen alten Stand für den neuen hält */
  const setzen = async (n) => (Number.isInteger(n) && n >= 0 && n <= 100 ? auftrag(String(n), () => null) : null)
  function beenden() { try { p?.stdin?.end(); p?.kill() } catch { /* schon weg */ } p = null; allesLoesen() }
  /** schon vorher starten: Das erste Übersetzen des Programmteils dauert ein bis zwei Sekunden */
  function vorwaermen() { void lesen() }
  return { lesen, setzen, beenden, vorwaermen }
}

module.exports = { erstelleLautstaerke, SKRIPT }
