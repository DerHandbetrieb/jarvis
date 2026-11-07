# Auto-Erkennung am Hof – Recherche 07.11.2026

Auftrag (Interview Auftraggeber 07.11.2026): Bekannte Autos am Hof mit Namen ansagen.
- **Nur Autos, keine Gesichter** (Gesichtserkennung = biometrische Daten, Art. 9 DSGVO; Haushaltsausnahme fraglich, weil DHL dort Firmenware abholt).
- **Kennzeichen zuerst**, Aussehen (Farbe/Form) als Zweitmerkmal → „vermutlich Chrissy“; lernt mit jedem bestätigten Besuch.
- **Unbekanntes Auto:** Ansage, Foto + gelesenes Kennzeichen höchstens 24 h zum Benennen, danach nur Kennzeichen, Name, Merkmale.
- **Ansage** „Sir, Chrissy fährt vor.“ + Spruch, im HUD Name am großen Bild; je Auto Haken „nicht ansagen“ (eigenes Auto).
- **Regeln nach Aussehen** ohne Speichern, z. B. „gelber Transporter = die Post ist da“; bekanntes Kennzeichen geht vor.
- Plan: Recherche → Machbarkeitstest mit Testbildern (7 Tage, ausdrücklich freigegebene Ausnahme von „nur live“) → vier Entwürfe → Bau → Prüfung.

## Kennzeichen lesen (lokal)

| Kandidat | Code | Gewichte | Deutsche Kennzeichen | Bemerkung |
|---|---|---|---|---|
| fast-plate-ocr (github.com/ankandrew/fast-plate-ocr) | MIT (LICENSE gelesen) | unbelegt | nicht belegt; Altmodell „european-plates“ 40+ Länder | ONNX, sehr schnell, Feintraining dokumentiert |
| open-image-models (Kennzeichen finden) | MIT | unbelegt, YOLOv9-basiert (YOLOv9-Code GPL-3.0) | nicht belegt | ONNX, 256–640 px |
| FastALPR (Kette aus beiden) | MIT | wie oben | – | einfachster Start |
| OpenALPR | AGPL-3.0 | – | „eu“-Konfiguration | kaum gepflegt |
| Ultralytics-Kennzeichenmodelle, LiteALPR | AGPL-3.0 | AGPL-3.0 | nein/unbelegt | – |
| PaddleOCR, EasyOCR | Apache-2.0 | unbelegt | nicht belegt | groß |

Vorläufige Wahl: **FastALPR (open-image-models + fast-plate-ocr)**. Offen: Lizenz der Gewichte klären; Lesbarkeit an eigenen Tag-/Nachtbildern messen; ggf. Feintraining.

## Farbe, Art, Wiedererkennung

| Kandidat | Lizenz | Kann | Größe |
|---|---|---|---|
| OpenVINO vehicle-attributes-recognition-barrier-0039 | Apache-2.0 (model.yml) | Farbe (weiß, grau, gelb, rot, grün, blau, schwarz), Art (car, bus, truck, van) | 0,6 M Parameter |
| OpenVINO vehicle-reid-0001 (OSNet-AIN) | MIT laut OMZ-Doku | Wiedererkennung (512er-Merkmal) | ONNX 8,8 MB |
| RT-DETR, YOLOX-S | Apache-2.0 | Auto im Bild finden | – |
| CLIP/OpenCLIP | MIT, aber Modellkarten nennen Überwachung „out of scope“ | Zero-Shot Farbe/Art | ~0,4 GB |
| Ultralytics YOLO | AGPL-3.0 | Erkennung | – |
| Apple MobileCLIP | nur Forschung | – | – |

Vorläufige Wahl: **vehicle-attributes-0039 + vehicle-reid-0001** (winzig, laufen auch auf dem Prozessor, Grafikspeicher bleibt frei). Offen: Lizenzdatei des ReID-Quellprojekts direkt lesen, Trainingsdaten (VeRi-776 ist nur für nicht-kommerzielle Nutzung erhältlich), Farbe bei Nacht (Infrarot = Graubild) messen.

Keiner der Kandidaten nennt Werte für Infrarot-Nachtbilder → Machbarkeitstest entscheidet.

Quellen: siehe Links in der Tabelle; Einzelnachweise u. a. ankandrew.github.io/fast-plate-ocr/latest/inference/model_zoo/, raw.githubusercontent.com/openvinotoolkit/open_model_zoo/master/models/intel/vehicle-attributes-recognition-barrier-0039/model.yml, docs.openvino.ai/2023.3/omz_models_model_vehicle_reid_0001.html, ultralytics.com/license, huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K, vehiclereid.github.io/VeRi.

## Machbarkeitstest (Version 0.24.3)

`electron/autotest.cjs`: Meldet die Kamera-Wache ein Auto am linken Objektiv, legt L.O.K.I. drei Standbilder (Abstand 3,2 s) in `%APPDATA%\Jarvis\auto-test` ab; höchstens 7 Tage ab dem ersten Bild, höchstens 400 Bilder. Nach der Auswertung löschen. Prüf-Agent: keine Störung der Wache; erstes Bild ansehen, ob das Standbild nur das linke Objektiv zeigt.
