# Dauer-HUD auf drei Bildschirmen: Wallpaper Engine oder eigenes Fenster?

Stand: 03.11.2026. Vorbereitung nach Projektregel 12 (Recherche, Blindspot-Pass, Interview-Fragen, Plan). Es wurde nichts installiert oder gebaut.

Kennzeichnung: **[offiziell]** = aus der Doku des Herstellers bzw. des Werkzeugs. **[unbestätigt]** = nur aus Foren, Drittseiten oder Schluss aus anderen Programmen. **[Lücke]** = dazu habe ich keine Aussage gefunden – das muss ein kleiner Test klären.

---

## 1. Recherche

### 1.1 Wallpaper Engine (WE): Web-Hintergrund (HTML/JS)

| Frage | Befund | Quelle |
|---|---|---|
| Was ist ein Web-Hintergrund? | HTML, CSS und JavaScript. Eigene Schnittstellen von WE: Benutzer-Eigenschaften, Audio-Visualisierer, RGB-Geräte, FPS-Begrenzer. Video nur .webm, .ogg, .ogv. **[offiziell]** | https://docs.wallpaperengine.io/en/web/overview.html |
| Dateien lokal? | Die Doku rät, wichtige Dateien nicht aus dem Netz zu laden, sondern HTML/CSS/JS/Bilder mitzuliefern (läuft dann auch offline). Beim Import kopiert WE den gewählten Ordner samt Unterordnern in sein Projektverzeichnis. **[offiziell]** | https://docs.wallpaperengine.io/en/web/first/gettingstarted.html |
| Zugriff auf andere lokale Dateien? | Ein Wallpaper-Autor schreibt (2020), dass der eingebaute Browser (CEF) Dateien außerhalb des Wallpaper-Ordners nicht lädt, außer der Nutzer wählt sie über eine Datei-Eigenschaft. **[unbestätigt]**, Stand 2020 | https://steamcommunity.com/sharedfiles/filedetails/changelog/2278898637?p=3 (Suchtreffer, Inhalt nur aus der Suchzusammenfassung) |
| Netzwerk (fetch, WebSocket, localhost)? | **[Lücke]**. Die offizielle Doku sagt dazu nichts. Szene-Hintergründe dürfen laut Forum keine Web-Anfragen machen, Web-Hintergründe können Wetter o. ä. laden, wenn der Autor es programmiert **[unbestätigt]**: https://steamcommunity.com/app/431960/discussions/0/3053988173741028962. Dass ein Web-Hintergrund `127.0.0.1` ansprechen darf, habe ich nirgends belegt gefunden. Das andere Programm „Sucrose" bietet das dagegen ausdrücklich (lokaler Server auf 127.0.0.1) **[unbestätigt, anderes Produkt]**: https://sourceforge.net/p/sucrose/wiki/Create%20Web%20Architecture/ |
| Chromium-/CEF-Version | **[Lücke]**. Die Doku nennt nur „Chromium Embedded Framework", keine Version. Es gibt den Schalter „CEF devtools port" (General), dann zeigt Chrome unter `localhost:8080` die Seiten zum Untersuchen – damit lässt sich die Version selbst auslesen (`navigator.userAgent`). **[offiziell]** https://docs.wallpaperengine.io/en/web/debug/debug.html |
| Benutzer-Eigenschaften | `window.wallpaperPropertyListener` mit `applyUserProperties`; Typen Farbe, Schieber, Haken, Auswahl, Text, Datei, Ordner. Datei-Wert braucht `file:///` davor. **[offiziell]** | https://docs.wallpaperengine.io/en/web/customization/properties.html |
| Audio | `wallpaperRegisterAudioListener(callback)`, ca. 30× pro Sekunde, 128 Werte (links 0–63, rechts 64–127). Das ist die Lautstärke des *Systems* (Musik/Spiel), kein eigener Ton aus dem Wallpaper. **[offiziell]** | https://docs.wallpaperengine.io/en/web/audio/visualizer.html |
| Leistung | Der Nutzer stellt in WE ein FPS-Limit ein; das Wallpaper soll es über `applyGeneralProperties` lesen und beachten. **[offiziell]** | https://docs.wallpaperengine.io/en/web/performance/fps.html |
| Pausieren bei Spielen | In den Einstellungen (Reiter Leistung) gibt es „Other application fullscreen" mit dem Wert „Stop (free memory)" – WE beendet sich, sobald ein Spiel/Vollbildprogramm startet. Zusätzlich Anwendungsregeln („Wallpaper playback": Stop / Keep running). **[offiziell]** | https://help.wallpaperengine.io/en/functionality/applicationrules.html |
| Mehrere Bildschirme | Ein Wallpaper kann über mehrere Monitore gehen (Gruppierung); Lage richtet sich nach der Gesamtfläche, die Auflösungen steuern die Mitte; ein lebendiges Wallpaper lässt sich nicht „zerschneiden". **[offiziell]** https://help.wallpaperengine.io/en/general/multiscreencenter.html. Hinweise aus Foren zur Option „Gruppieren"/„Strecken" **[unbestätigt]**: https://steamcommunity.com/app/431960/discussions/2/1744479064004281636 |
| Klicks / Maus | **[Lücke / unbestätigt]**. Laut Forum reagieren Web-Hintergründe auf dem Desktop nicht wie normale Fenster auf Klicks (Aussage eines Nutzers; Entwickler antwortete nur „Web-Typ ist anders"). Ob Mausbewegung ankommt, ist unklar. Symbole lassen sich per Tastenkürzel ein-/ausblenden (Reiter „General"). https://steamcommunity.com/app/431960/discussions/1/1291817837632232069 |
| Veröffentlichen | Sichtbarkeit: öffentlich, nur Freunde, privat. **[offiziell]** https://docs.wallpaperengine.io/en/scene/first/publishing.html. Das Hochladen ist freiwillig. Wir müssten nichts veröffentlichen: ein lokales Projekt genügt (Schluss aus der Doku, Import in den lokalen Projektordner). |

**Folgerung WE:** Die wichtigsten Fragen für uns (Datenweg vom Programm zum Wallpaper, Klicks) sind offiziell **nicht beantwortet**. Das lässt sich in etwa einer Stunde mit einem Wegwerf-Test klären (Etappe 0).

### 1.2 Wie liefert Jarvis Daten an ein WE-Wallpaper?

Möglichkeiten, nach Sicherheit/Aufwand geordnet:

1. **Datei-Eigenschaft von WE**: Der Nutzer wählt einmal eine Datei (z. B. `%APPDATA%\Jarvis\hud\daten.json`), WE reicht den Pfad an das Wallpaper. Ob das Wallpaper die Datei dann *wiederholt neu lesen* darf (fetch auf `file:///`), ist **[Lücke]** – der Autoren-Bericht oben spricht eher dafür, dass Dateien aus Eigenschaften gehen, aber Änderungen live zu lesen ist ungeprüft.
2. **Lokaler HTTP-/WebSocket-Server von Jarvis** nur auf 127.0.0.1: technisch der sauberste Weg, aber ob WE-CEF das aus einer `file://`-Seite zulässt, ist **[Lücke]**. Allgemein gilt im Browser: `file://`-Seiten haben eine „undurchsichtige Herkunft" (https://developer.mozilla.org/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp **[offiziell, MDN]**), der Server müsste daher passende CORS-Kopfzeilen senden; bei WebSocket gibt es keine CORS-Prüfung, der Server sollte die Herkunft prüfen.
3. **Wallpaper holt Daten selbst aus dem Netz** (Supabase): wäre ohne Jarvis möglich, widerspricht aber unserem Plan (Anmeldung mit Zwei-Faktor, Schlüssel gehören nicht in Wallpaper-Dateien). Nicht empfohlen.

Wichtig: Alles, was ins Wallpaper-Verzeichnis kopiert wird, ist lesbar – **keine Schlüssel, Passwörter oder Kamera-Zugangsdaten in die Wallpaper-Dateien.**

### 1.3 Kameras

Reolink-Kameras: RTSP-Adresse `rtsp://Benutzer:Passwort@IP/Preview_01_main` bzw. `…/Preview_01_sub` (kleiner Strom), Port 554; RTSP ist bei den meisten Kameras zunächst ausgeschaltet. **[offiziell]** https://support.reolink.com/hc/en-us/articles/360007010473-How-to-Live-View-Reolink-Cameras-via-VLC-Media-Player/ (Das Kameramodell des Auftraggebers ist noch nicht bekannt.)
Browser (auch WE-Web) spielen RTSP nicht direkt ab; es braucht eine Umwandlung (z. B. in Einzelbilder oder einen Web-Strom) durch ein Hilfsprogramm. Das ist ein eigenes Teilprojekt (Lizenz/Kosten dafür vorher prüfen). Als einfachster Anfang: Jarvis holt alle paar Sekunden ein Standbild und reicht es weiter. Ob die Kamera eine Standbild-Schnittstelle bietet, ist je Modell zu prüfen **[Lücke]**.

### 1.4 Alternative ohne WE: eigenes Electron-Fenster hinter den Desktop-Symbolen („WorkerW")

- Technik: Eine undokumentierte Nachricht (`0x052C`) an das Fenster „Progman", dann das eigene Fenster per `SetParent` in das „WorkerW"-Fenster hängen. **[unbestätigt]** (Drittquellen): https://docs.rs/crate/tauri-plugin-desktop-underlay/latest/source/src/core/windows.rs, https://www.autohotkey.com/boards/viewtopic.php?p=425051
- Windows 11 24H2: Berichte sind **gemischt** **[unbestätigt]**: Im AutoIt-Forum wurde es mit Fensterabzählung zum Laufen gebracht (die Suche nach dem richtigen WorkerW war schwierig); in einer Microsoft-Q&A-Frage zeigt `0x052C` keine Wirkung. Der Auftraggeber hat Windows 11 Pro 10.0.26200 (= 25H2) – muss selbst getestet werden. Quelle: https://learn.microsoft.com/en-us/answers/questions/1691371/are-the-desktop-animations-not-available-in-window
- Electron selbst: `getNativeWindowHandle()` liefert das Fenster-Handle (HWND), damit lässt sich `SetParent` aufrufen; `setIgnoreMouseEvents(true, {forward:true})`, `setFocusable`, `setSkipTaskbar` sind vorhanden; unter Windows gilt: Mausweiterleitung setzt zeitweise aus, wenn ein Fenster mit höheren Rechten (z. B. Task-Manager, Installer) aktiv ist. **[offiziell]** https://www.electronjs.org/docs/latest/api/browser-window. Eine fertige Electron-Option „type: desktop" habe ich in der Doku nicht gefunden.
- `SetParent` aus Node heraus braucht ein natives Hilfsmittel (z. B. kleines Zusatzprogramm/Modul, koffi/ffi). Das ist eine neue Abhängigkeit **[Lücke]**, vor dem Bau prüfen.
- Risiken: Windows-Update kann den Trick brechen; Grafikspeicher/Leistung liegt bei uns (kein eingebautes Pausieren bei Spielen – müssten wir selbst bauen); zweites „Hintergrundbild" kollidiert mit WE, wenn beides gleichzeitig läuft.
- Vorteile: Volle Kontrolle (Canvas 5760×1080 wie die abgenommene Start-Sequenz, Daten direkt per IPC aus Jarvis, keine fremde CEF-Beschränkung, Kameras einfach).

---

## 2. Blindspot-Pass (Unknown Unknowns)

1. **Grafikkartenlast neben Spielen**
   - Was: Die Start-Sequenz schafft 60 B/s auf 5760×1080; als Dauer-Anzeige frisst das ständig GPU und Strom.
   - Warum es uns erwischt: Der Auftraggeber hat eine RTX 4080 und spielt vermutlich; Lokis Stimme belegt schon 3,4–3,8 GB Grafikspeicher.
   - Satz im Auftrag: „Das Dauer-HUD zeichnet im Ruhezustand höchstens 10–15 Bilder pro Sekunde, hält sich an das FPS-Limit von Wallpaper Engine (bzw. ein eigenes Limit) und pausiert, sobald ein Vollbildprogramm oder Spiel läuft."
2. **Datenschutz der Kamerabilder**
   - Was: Live-Bilder von Außenkameras erscheinen großflächig auf Bildschirmen (Bildschirmfoto, Screensharing, Besucher, Kollege).
   - Warum: Die Kameras zeigen eventuell Nachbargrundstück/Straße (Datenschutz, DSGVO-Grundsatz „nur eigenes Grundstück") und Zugangsdaten stecken in den RTSP-Adressen.
   - Satz: „Kamerabilder gehen nur lokal, nie ins Internet; Zugangsdaten nur im Windows-Anmeldespeicher, nie in Wallpaper-Dateien; es gibt einen Schalter, der die Kameras sofort ausblendet, und beim Screensharing/Sperren des PCs werden sie nicht gezeigt."
3. **Sonniss-Töne dürfen nicht in den Workshop**
   - Was: Die Sonniss-Lizenz erlaubt Nutzung im fertigen Projekt, aber **nicht**, die Töne als Dateien weiterzugeben oder in Paketen zu veröffentlichen, und verbietet KI-Training. Quelle **[offiziell]**: https://sonniss.com/gdc-bundle-license/
   - Warum: Ein Wallpaper-Projekt, das Töne als Dateien enthält und veröffentlicht (oder geteilt) wird, wäre eine Weitergabe der Dateien.
   - Satz: „Wallpaper-Projekte werden nie veröffentlicht oder weitergegeben, und enthalten keine Sonniss-Töne; Töne bleiben im Jarvis-Programm." (WE-Web spielt ohnehin keinen Systemton aus eigener Quelle auf Befehl ab – nicht geprüft.)
4. **Ausfallverhalten, wenn Jarvis nicht läuft**
   - Was: Das HUD zeigt alte oder keine Daten.
   - Warum: Autostart kann scheitern, Jarvis wird beendet, Netz weg; ein Dauerbild mit veralteten Zahlen täuscht.
   - Satz: „Jedes Feld zeigt sein Datenalter; ohne Jarvis oder bei Daten älter als X Minuten wird das Feld ausgegraut mit Hinweis 'keine Verbindung', nie alte Zahlen als aktuell."
5. **Wallpaper-Engine-Beschränkungen sind offen**
   - Was: Localhost-Zugriff, Klicks, CEF-Version sind nicht dokumentiert.
   - Warum: Wir könnten Wochen bauen und dann merken, dass der Datenweg gesperrt ist, oder dass WE-Update ihn bricht.
   - Satz: „Vor jedem Bau läuft ein Wegwerf-Test, der Datenweg und Mausverhalten in WE belegt; ein WE-Update darf das HUD nicht lahmlegen (Selbsttest nach Update)."
6. **Werkstatt-Daten und Anmeldung (Abschnitt 6 der CLAUDE.md)**
   - Was: Echte Statistiken/Karten setzen die Supabase-Anbindung voraus.
   - Warum: Bisher gibt es keine; das HUD kann nur mit Beispieldaten starten.
   - Satz: „Das HUD wird zuerst mit klar als Beispieldaten gekennzeichneten Zahlen gebaut; echte Werkstatt-Daten kommen erst nach der separat freigegebenen Anbindung mit Nur-Lese-Konto."
7. **Sicherheit der lokalen Schnittstelle**
   - Was: Ein lokaler Server auf 127.0.0.1 ist von jedem Programm und jeder Webseite im Browser des PCs erreichbar.
   - Warum: Eine fremde Webseite könnte versuchen, `127.0.0.1:Port` abzufragen und Kamerabilder/Zahlen zu lesen.
   - Satz: „Der lokale Server hört nur auf 127.0.0.1, prüft die Herkunft, verlangt ein zufälliges Zugriffs-Token, und liefert nur Anzeigedaten, nie Schlüssel."
8. **Ablenkung/Arbeitsalltag und Brandschutz der Anzeige (Einbrennen)**
   - Was: Ein ständig gleiches helles Bild kann bei OLED einbrennen; bei den BenQ GL2580 (LCD) kaum.
   - Warum: Gering, aber bei späteren Monitoren relevant.
   - Satz: „Das HUD hat dunklen Hintergrund und leichte Bewegung; bei Bildschirmschoner/Sperre wird es nicht hell gehalten."
9. **Mehrere Bildschirme: Taskleiste und Symbole**
   - Was: Ein Hintergrund liegt unter den Symbolen und hinter der Taskleiste; Fenster darüber verdecken ihn.
   - Warum: Der Auftraggeber arbeitet auf den Bildschirmen – das HUD ist nur auf freiem Desktop sichtbar, und Symbole laufen über das HUD.
   - Satz: „Das Dauer-HUD ist ein Hintergrund (liegt hinter Fenstern und Symbolen); wo Symbole liegen, müssen Anzeigen Platz lassen oder die Symbole sind per Tastenkürzel ausblendbar."

---

## 3. Interview-Fragen (eine nach der anderen, jeweils mit Empfehlung)

1. **Wie willst du das HUD benutzen: nur anschauen, oder auch anklicken?**
   - Empfehlung: **nur anschauen** (Hintergrund) für Etappe 1; Klicks (To-do abhaken) später separat.
   - Begründung: Bei Wallpaper Engine sind Klicks auf dem Desktop unklar **[unbestätigt]**; nur-anschauen funktioniert sicher bei beiden Wegen und spart Aufwand.
2. **Wie wichtig ist, dass das HUD sich bei Spielen/Vollbild selbst abschaltet?**
   - Empfehlung: **sehr wichtig – automatisch stoppen/pausieren**.
   - Begründung: Schont die RTX 4080 für Spiele. Bei WE eine Einstellung („Other application fullscreen"), im eigenen Fenster müssten wir es selbst bauen.
3. **Welche Inhalte zuerst?**
   - Empfehlung: **Uhr, Datum, Wetter, Systemwerte (CPU/RAM/GPU), Beispiel-Kacheln der Werkstatt** (klar als Beispiel gekennzeichnet); Kameras und echte Werkstatt-Zahlen danach.
   - Begründung: Funktioniert ohne Supabase-Anbindung und ohne Kamera-Fragen; trägt gleich zur Abnahme des Stils bei.
4. **Kameras: welche Modelle, was soll zu sehen sein, wie oft aktualisieren?**
   - Empfehlung: **zuerst Standbild alle 2–5 Sekunden**, später Bewegtbild nur auf Wunsch.
   - Begründung: Viel einfacher und sicherer; Reolink bietet RTSP (Port 554) **[offiziell]**, aber der Browser spielt RTSP nicht direkt ab. Außerdem: Zeigen die Kameras öffentlichen Raum / Nachbarn? (Datenschutz)
5. **Soll das HUD auf allen Bildschirmen dauerhaft den ganzen Desktop füllen (auch wenn Symbole/Fenster darauf liegen), oder nur auf einem Bildschirm?**
   - Empfehlung: **alle drei als eine Fläche wie die Start-Sequenz**, Symbole auf dem linken Bildschirm ausgeblendet oder verschiebbar.
   - Begründung: Passt zur abgenommenen Optik; das ist auch der Grund für den Test mit der Gruppierung in WE (Auflösung 5760×1080).
6. **Darf ich Wallpaper Engine für einen Test ausprobieren (nur lokales, privates Projekt, nichts veröffentlicht) und dabei kurz sein vorhandenes Wallpaper wechseln?**
   - Empfehlung: **ja, mit Zurückstellen danach**.
   - Begründung: Nur ein Test belegt Datenweg und Klicks; Wechsel ist rückgängig machbar. Sonst Wegwerf-Fenster ohne WE (Etappe 0b).

---

## 4. Plan in kleinen Etappen

Reihenfolge so gewählt, dass die Unsicherheiten zuerst geklärt werden.

**Etappe 0a – Wegwerf-Test in Wallpaper Engine (≈ 1 Stunde, nichts im Projekt)**
- Inhalt: Winzige HTML-Seite als lokales WE-Projekt: zeigt (1) `navigator.userAgent` (= Chromium-Version), (2) Ergebnis eines `fetch('http://127.0.0.1:Port/ping')`, (3) einer WebSocket-Verbindung, (4) liest eine Datei per Datei-Eigenschaft, (5) zeigt Mausklick-/Bewegungs-Ereignisse; eine Testgruppe über alle drei Bildschirme.
- Testanleitung: „Wallpaper Engine → Neues Wallpaper erstellen → Ordner wählen. Auf den drei Bildschirmen anzeigen. Du solltest grüne/rote Zeilen sehen: Version, fetch ok/Fehler, WebSocket ok/Fehler, Datei ok/Fehler. Dann klicke auf den freien Desktop und auf ein Symbol – es zeigt ‚Klick angekommen' oder nicht. Starte ein Spiel/Vollbild – das Wallpaper soll sich beenden."
- Ergebnis entscheidet: WE (Weg 1) oder eigenes Fenster (Weg 2).

**Etappe 0b – Wegwerf-Test WorkerW mit Electron (≈ 1 Stunde, parallel möglich)**
- Inhalt: Kleines Electron-Fenster, per `SetParent` hinter die Symbole gehängt (Windows 11, Build 26200), Farbfläche über alle drei Bildschirme.
- Testanleitung: „Starte den Test; du solltest eine Farbfläche hinter den Symbolen auf allen drei Bildschirmen sehen, Symbole bleiben klickbar. Beenden mit Esc/Tray; danach ist das normale Hintergrundbild wieder da."
- Risiko: 24H2/25H2-Berichte gemischt **[unbestätigt]**.

**Etappe 1 – Stil und Layout als Dauer-Anzeige (Vorschau, nichts im Hintergrund)**
- Inhalt: Aus `vorschau/start-sequenz/bewegt/` ein ruhiger Dauerzustand (niedrige Bildrate, wenig Bewegung), vier Entwürfe zur Wahl (Regel 13), Beispieldaten gekennzeichnet.
- Test: „Öffne die Vorschau auf allen Bildschirmen. Wähle einen der vier Entwürfe; nichts ragt über den Rand."

**Etappe 2 – Datenweg Jarvis → HUD**
- Inhalt: gewählter Weg aus 0a/0b: lokale Schnittstelle nur 127.0.0.1 mit Zugriffs-Token **oder** direkt per IPC im eigenen Fenster; erste echte Werte: Uhrzeit, Datum, Wetter (Open-Meteo), CPU/RAM/GPU.
- Test: „Starte Jarvis; im HUD laufen Uhr und Systemwerte. Beende Jarvis: die Felder werden grau und zeigen ‚keine Verbindung'."

**Etappe 3 – Verhalten bei Spielen und Leistung**
- Inhalt: Bildratenbegrenzung, Pause bei Vollbild, Schalter an/aus (Tastenkürzel + Infobereich-Symbol), Messung Grafiklast.
- Test: „Starte ein Spiel; das HUD pausiert und die Grafiklast sinkt (Task-Manager). Beende das Spiel; das HUD läuft weiter."

**Etappe 4 – Werkstatt-Daten (setzt Abschnitt 6 voraus)**
- Inhalt: Nur-Lese-Konto, Statistiken, To-do-Karten; vor dem Bau gesondert abstimmen.
- Test: „Ändere eine Aufgabe in der Werkstatt-App; im HUD erscheint sie nach spätestens einer Minute."

**Etappe 5 – Kameras (nur nach Klärung Frage 4)**
- Inhalt: Standbilder, Schalter „Kameras aus", keine Zugangsdaten in Dateien, Anmeldespeicher.
- Test: „Schalte die Kamera-Kachel ein; ein Bild erscheint. Schalte aus: sofort verschwunden."

**Etappe 6 – Feinschliff**
- Inhalt: Töne bleiben in Jarvis (Sonniss-Regel), Ausfall-Anzeige, Autostart nach Windows-Start, Test nach WE-Updates (falls WE).

Jede Etappe wird einzeln gebaut, geprüft (separater Prüf-Agent), mit `npm run build` getestet und committet.

---

## 5. Empfehlung: Wallpaper Engine oder eigenes Fenster?

| | **Wallpaper Engine (Web-Wallpaper)** | **Eigenes Electron-Fenster (WorkerW)** |
|---|---|---|
| Nutzen | Kennt der Auftraggeber schon; Pausieren bei Spielen, FPS-Limit, Mehrbildschirm-Gruppierung sind fertig **[offiziell]** | Volle Kontrolle; Datenweg direkt aus Jarvis (kein Server nötig); Kameras einfach; keine Abhängigkeit von fremdem Programm |
| Kosten | Wallpaper Engine ist schon vorhanden; Aufwand: Datenweg bauen (Server/Datei) und Wallpaper bauen | Mehr Eigenbau: Einhängen hinter Symbole (natives Hilfsmittel), Pause bei Spielen, Mehrbildschirm-Fenster selbst |
| Risiko | **Datenweg und Klicks undokumentiert** (localhost, Dateien, CEF-Version); Wallpaper-Update kann Dinge ändern; CEF-Sandbox sperrt eventuell Dateien | **Windows-11-Trick nicht offiziell**, 24H2/25H2 gemischt **[unbestätigt]**; ein Windows-Update kann ihn brechen; ggf. Konflikt mit WE auf demselben Hintergrund |

**Empfehlung (vorläufig, belastbar erst nach Etappe 0a/0b):**
1. Zuerst **beide Wegwerf-Tests** (Etappe 0a und 0b). Ergebnis:
   - Wenn in WE `fetch`/WebSocket auf `127.0.0.1` oder die Datei-Eigenschaft funktioniert → **Wallpaper Engine**: weniger eigener Code, Spiel-Pause fertig.
   - Wenn nicht, aber WorkerW unter Windows 11 (26200) funktioniert → **eigenes Fenster**.
   - Wenn beides schwierig → **eigenes randloses Fenster hinter allen anderen Fenstern** (ohne Symbolebene, nicht als echter Hintergrund) als einfacher Notanker.
2. Tendenz heute: **Wallpaper Engine**, *wenn* der Datenweg im Test besteht, weil Pause bei Spielen, Leistungseinstellungen und Mehrbildschirm-Betrieb schon fertig sind und der Auftraggeber es bereits benutzt. Sonst eigenes Fenster.

## Quellenliste

- https://docs.wallpaperengine.io/en/web/overview.html
- https://docs.wallpaperengine.io/en/web/first/gettingstarted.html
- https://docs.wallpaperengine.io/en/web/customization/properties.html
- https://docs.wallpaperengine.io/en/web/audio/visualizer.html
- https://docs.wallpaperengine.io/en/web/performance/fps.html
- https://docs.wallpaperengine.io/en/web/debug/debug.html
- https://docs.wallpaperengine.io/en/scene/first/publishing.html
- https://help.wallpaperengine.io/en/functionality/applicationrules.html
- https://help.wallpaperengine.io/en/general/multiscreencenter.html
- https://www.electronjs.org/docs/latest/api/browser-window
- https://sonniss.com/gdc-bundle-license/
- https://support.reolink.com/hc/en-us/articles/360007010473-How-to-Live-View-Reolink-Cameras-via-VLC-Media-Player/
- https://developer.mozilla.org/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp
- Unbestätigt (Foren/Drittseiten): https://steamcommunity.com/app/431960/discussions/0/3053988173741028962 , https://steamcommunity.com/app/431960/discussions/1/1291817837632232069 , https://steamcommunity.com/app/431960/discussions/2/1744479064004281636 , https://steamcommunity.com/sharedfiles/filedetails/changelog/2278898637?p=3 , https://sourceforge.net/p/sucrose/wiki/Create%20Web%20Architecture/ , https://www.autohotkey.com/boards/viewtopic.php?p=425051 , https://docs.rs/crate/tauri-plugin-desktop-underlay/latest/source/src/core/windows.rs , https://learn.microsoft.com/en-us/answers/questions/1691371/are-the-desktop-animations-not-available-in-window
