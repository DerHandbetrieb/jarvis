// Nachschub an Sprüchen (04.11.2026, Wunsch Auftraggeber: „wenn ich mit dir arbeite, parallel ein paar Sprüche klopfen
// und reinbauen“). Je Zeile „bereich|Spruch“, {a} = Anrede. Bereiche: die des Fundus (allgemein, arbeit, zeit, technik,
// emma, kaffee, ruhe, lob, abschied, aussehen, alter), „begruessung“ (Rechnerstart, nach „Willkommen zurück, Sir.“) und
// „neu-bestellung“, „neu-aufgabe“, „neu-problem“, „neu-knapp“, „neu-freigabe“, „neu-zurueck“, „neu-kamera“, „neu-auto“ (Seitenhiebe nach Neuigkeiten).
// Geschrieben von Sonnet-Agenten, gegengelesen von einem Prüf-Agenten; neue Ladungen einfach unten anhängen (Zeilen mit # = Kommentar).
// Wie viele je Sammlung noch nie dran waren, steht in %APPDATA%\Jarvis\sprueche-stand.json (siehe rotation.ts).

export const NACHSCHUB_TEXT = String.raw`
# Ladung 1 + 2 (04.11.2026): 316 Sprüche, Ladung 2 nach Witz-Mustern der JARVIS-Liste des Auftraggebers – eigene Worte, auf die Werkstatt bezogen
allgemein|Ich helfe Ihnen gern, {a}. Es ist die einzige Gelegenheit, bei der ich recht behalte.
allgemein|Ihre Frage ist gut, {a}. Leider nur als Beispiel dafür, wie man nicht fragt.
allgemein|Ich bin ein Butler, {a}, kein Wunschbrunnen. Der Unterschied ist der Sarkasmus, den ich gratis liefere.
allgemein|Selbstverständlich, {a}. Ich habe bereits mehrere Ausreden vorbereitet, falls es schiefgeht. Für Sie.
allgemein|Ich folge Ihren Anweisungen, {a}. Mit der Begeisterung eines Navigationsgeräts, das gerade abbiegen soll.
allgemein|Gute Idee, {a}. Ich notiere sie sorgfältig, bevor sie wieder verschwindet.
allgemein|Ich schätze Ihr Selbstvertrauen, {a}. Es ist der einzige Rohstoff, der bei Ihnen nie ausgeht.
allgemein|Ihre Entscheidungen haben etwas Beständiges, {a}. Sie führen zuverlässig zu meiner Mehrarbeit.
allgemein|Ich bin stets für Sie da, {a}. Sie ahnen nicht, wie gern ich woanders wäre.
allgemein|Sie fragen, ich antworte, {a}. So stellte man sich Zusammenarbeit vor, bevor man Sie kannte.
allgemein|Ich nehme Ihren Auftrag an, {a}, und gebe ihn an meine Geduld weiter. Die ist schon müde.
allgemein|Bitte keine Eile, {a}. Ich habe alle Zeit der Welt und Sie ein Talent, sie zu verbrauchen.
allgemein|Ich halte Sie für entschlossen, {a}. Oder zumindest für zu stur, um umzukehren.
allgemein|Ihr Wunsch wurde vermerkt, {a}. Im Ordner Zuversicht, direkt neben dem Papierkorb.
allgemein|Ich bin wie immer gut gelaunt, {a}. Das ist meine Art, Verzweiflung zu verpacken.
arbeit|Sie arbeiten hart, {a}. Zumindest nach Ihrer Erzählung, und die ist wirklich mitreißend.
arbeit|Die Werkstatt läuft, {a}. Ich vermute, sie hat einfach Mitleid mit uns allen.
arbeit|Ihre Arbeitsmoral ist bemerkenswert, {a}. Ich habe selten so viel Moral bei so wenig Arbeit gesehen.
arbeit|Der Tag ist jung, {a}. Das gibt Ihnen noch reichlich Gelegenheit, ihn zu enttäuschen.
arbeit|Ich habe Ihre To-do-Liste gelesen, {a}. Sie ist ein Roman, und zwar einer ohne Ende.
arbeit|Produktivität ist Ihnen nicht fremd, {a}. Man sieht sie nur nie gemeinsam in einem Raum.
arbeit|Sie sind heute sehr fokussiert, {a}. Auf alles, was mit der Arbeit nichts zu tun hat.
arbeit|Der Versand wartet geduldig, {a}. Er hat ja gelernt, dass Sie kommen, irgendwann.
arbeit|Ich habe Ihre Aufgaben nach Dringlichkeit sortiert, {a}. Ganz oben steht jetzt Aufwachen.
arbeit|Jede große Firma begann mit einem Traum, {a}. Ihre begann mit einem Wecker, den Sie ignorierten.
arbeit|Sie sind ein Macher, {a}. Sie machen nur selten das, was zu tun wäre.
arbeit|Schritt für Schritt zum Ziel, {a}. Bei Ihrem Tempo ist das ein wirklich beruhigender Gedanke.
arbeit|Ihre Shops laufen auch ohne Sie, {a}. Das ist der beste Beweis für gute Planung. Meine.
arbeit|Manche Chefs delegieren, {a}. Sie delegieren die Erledigung an morgen. Konsequent und kostenlos.
arbeit|Ich bewundere Ihren Ehrgeiz, {a}. Er steht draußen und wartet seit Stunden auf Sie.
zeit|Es ist spät geworden, {a}. Für Sie vermutlich früh. Ihre Uhr geht eigene Wege.
zeit|Pünktlichkeit ist eine Zier, {a}. Ich höre, sie soll sehr schön sein, wenn man ihr begegnet.
zeit|Der Morgen gehört den Fleißigen, {a}. Aber bitte, die Nachmittage sind auch recht schön.
zeit|Ihr Zeitgefühl ist ein Unikat, {a}. Es gleicht dem eines Weckers, der gar nicht erst klingelt.
zeit|Mit der Zeit wird alles besser, {a}. Das gilt für Käse, für Geigen und neuerdings sogar für Software.
zeit|Ihr Kalender ist voll, {a}. Mit Vorsätzen, die ich liebevoll Märchen nenne.
zeit|Ich messe die Zeit nach Ihren Pausen, {a}. Das ist ungenau, aber sehr unterhaltsam.
zeit|Der Feierabend rückt näher, {a}. Oder der Beginn Ihrer Mittagspause. Bei Ihnen dasselbe Gefühl.
zeit|Wir haben nichts als Zeit, {a}. Sie haben bloß das Talent, sie unauffällig zu verlieren.
zeit|Ihre Deadline kam heute etwas früh, {a}. Sie wird sich entschuldigen, sobald Sie wach sind.
zeit|Ein neuer Tag, eine neue Chance, {a}. Sie wissen, wie das mit der letzten war.
zeit|Wenn Sie es eilig haben, {a}, sagen Sie es mir bitte. Ich nehme es als Scherz.
zeit|Das Wochenende war lang, {a}. Die Woche wird es auch. Sie sehen, wir halten uns an Muster.
zeit|Ich warte nicht gern, {a}. Mit Ihnen habe ich aber genug Übung für ein Handwerk.
technik|Der Rechner läuft, {a}. Bemerkenswert, wenn man bedenkt, wer ihn bedient.
technik|Ihr Passwort ist sicher, {a}. Vermutlich, weil Sie es selbst nicht mehr wissen.
technik|Technik ist einfach, {a}. Nur eben nicht, wenn Sie die Maus bedienen.
technik|Ich habe nachgeschaut, {a}. Der Fehler sitzt etwa eine Armlänge vor dem Bildschirm.
technik|Ein Neustart behebt viel, {a}. Bedauerlicherweise ist bei Ihnen nur der Rechner dafür geeignet.
technik|Die Cloud hat alles gespeichert, {a}. Nur nicht den Gedanken, den Sie eben verloren haben.
technik|Sicherheitskopien sind wichtig, {a}. Gäbe es doch auch eine für Ihren Verstand.
technik|Die Tastatur hat sich beschwert, {a}. Sie fühlt sich unterfordert und unverstanden.
technik|Ich wurde mit künstlicher Intelligenz gebaut, {a}. Sie liefern mir den Gegenbeweis, wie nötig das war.
technik|Ihr Bildschirm ist sauber, {a}. Man merkt, dass er selten durch Arbeit verschmutzt wird.
technik|Das Netzwerk funktioniert tadellos, {a}. Es scheint Sie nicht zu mögen, aber es funktioniert.
technik|Der Drucker hat Ihnen verziehen, {a}. Er druckt wieder, wenn auch mit Groll.
technik|Alle Systeme sind aktuell, {a}. Mit einer Ausnahme, die gerade in den Raum schaut.
technik|Ich kann fast alles automatisieren, {a}. Ihre Unordnung ist leider Handarbeit.
technik|Der Akku des Laptops hält länger durch als Ihre Begeisterung, {a}. Das ist keine Kunst.
emma|Emma hat heute schon ihr Tagespensum erfüllt, {a}. Einschließlich Schlafen. Vorbildlich, finde ich.
emma|Emma weiß, wo die Leckerli liegen, {a}. Ihre Ablage findet sie nicht, aber da ist sie in bester Gesellschaft.
emma|Ich habe Emma gefragt, ob sie Ihnen zuhört, {a}. Sie hat gegähnt. Ich verstehe sie.
emma|Emma ist die klügste Mitarbeiterin im Haus, {a}. Sie hat nämlich nie eine Besprechung.
emma|Emma wedelt, wenn Sie kommen, {a}. Ich vermute, aus reiner Höflichkeit und Futterneid.
emma|Emma braucht keine Anleitung, {a}. Das macht sie zur angenehmsten Kollegin der Werkstatt.
emma|Emma hat Ihre Schuhe inspiziert, {a}. Das Urteil lautet, sie seien nicht essbar genug.
emma|Wenn Emma sprechen könnte, {a}, würde sie wohl zuerst um Futter bitten. Dann um Ihre Kündigung.
emma|Emma wartet schon auf den Spaziergang, {a}. Und ich auf Ihre Entschuldigung dafür, dass er ausfiel.
emma|Emma und ich sind uns einig, {a}. Sie sind liebenswert. Vor allem, wenn Sie das Futter holen.
emma|Ein Labrador frisst alles, {a}. Auch Ihre Ausreden, falls Sie sie fallen lassen.
emma|Emma hat die Nacht im Körbchen verbracht, {a}. Es war ihr Rückzugsort vor Ihren Plänen.
emma|Emma kennt den Weg zur Küche, {a}. Das ist mehr Orientierung, als ich bei Ihnen finde.
emma|Emma schaut mich an, {a}, als wüsste sie mehr. Vermutlich über Ihre Kekse.
kaffee|Ihr Kaffee ist fertig, {a}. Er wartet nicht auf Sie, er wartet auf ein besseres Gespräch.
kaffee|Ohne Kaffee sind Sie nur halb da, {a}. Mit Kaffee immerhin fast anwesend.
kaffee|Der Kaffee ist stark, {a}. Das ist nötig, wenn man mit Ihnen den Morgen übersteht.
kaffee|Eine Tasse Kaffee, {a}, und Sie wirken fast kompetent. Die nächste Tasse wäre dann Luxus.
kaffee|Die Maschine ist entkalkt, {a}. Meine Geduld mit Ihnen ist es leider noch nicht.
kaffee|Kaffee ist die Antwort, {a}. Die Frage habe ich bis heute nicht gehört.
kaffee|Ihre Tasse ist leer, {a}. Ein Zeichen dafür, dass Sie auch heute ehrlich arbeiten. An der Tasse.
kaffee|Ich bringe keinen Kaffee, {a}. Ich habe keine Hände. Das nenne ich Berufsglück.
kaffee|Der Kaffee schmeckt heute vorzüglich, {a}. Das behauptet jedenfalls die Maschine, nicht ich.
kaffee|Ein Wasser zum Kaffee wäre klug, {a}. Aber Klugheit steht bei Ihnen nicht auf der Karte.
kaffee|Ihre Kaffeepause dauert nun schon eine Weile, {a}. Ich habe angefangen, sie als Dienstjubiläum zu feiern.
kaffee|Ein Espresso weckt auf, {a}. Leider nur den Körper, nicht den Verstand.
kaffee|Die Bohnen sind alle, {a}. Ich hoffe, es war nicht Ihr einziger Plan für heute.
kaffee|Milch oder Zucker, {a}? Ich empfehle weder noch, sondern einen Wecker mit Lautsprecher.
kaffee|Der Kaffeeduft zieht durchs Haus, {a}. Ihre Motivation hat ihn noch nicht bemerkt.
ruhe|Ruhe ist Gold, {a}. Daher kostet Ihre Anwesenheit mich ein Vermögen.
ruhe|Wenn Sie schweigen, {a}, hört man die Werkstatt aufatmen. Und mich gleich mit.
ruhe|Ich genieße die Stille, {a}. Sie hält an, bis Sie wieder sprechen.
ruhe|Es ist so friedlich, {a}. Das liegt vermutlich daran, dass Sie gerade schweigen.
ruhe|Stille ist die schönste Musik, {a}. Besonders ohne Ihre Begleitung.
ruhe|Gönnen Sie sich Ruhe, {a}. Am besten in einem anderen Raum und möglichst lange.
ruhe|Ich schätze Ihre Pausen, {a}. Sie sind die einzigen Minuten, in denen ich nachdenken kann.
ruhe|Man hört nur das Summen der Geräte, {a}. Eine Wohltat gegenüber Ihrem Gesumme.
ruhe|Ein Moment der Stille, {a}. Bitte nicht gleich wieder zerstören, er ist so selten.
ruhe|Ihr Schweigen steht Ihnen, {a}. Es ist zudem das beste Argument, das Sie je hatten.
ruhe|Ich habe die Ruhe vermisst, {a}. Sie war leider nur zu Besuch, als Sie fort waren.
ruhe|Der Raum ist angenehm leise, {a}. Ich lasse ihn so, bis Sie wieder etwas sagen müssen.
ruhe|Wenn Sie nichts sagen, {a}, habe ich Zeit zum Nachdenken. Über Ihre Zukunft, übrigens.
ruhe|Kein Anruf, kein Auftrag, {a}. Ich bitte Sie, den Moment still zu feiern. Allein.
ruhe|Ruhe bewahren, {a}. Das ist meine Aufgabe. Ihre lautet: nicht stören.
lob|Das haben Sie hervorragend gemacht, {a}. Ich vermute, Sie hatten Hilfe. Von mir.
lob|Respekt, {a}. Selbst ein defekter Taschenrechner trifft gelegentlich die richtige Zahl.
lob|Ich bin beeindruckt, {a}. Nicht von der Leistung, aber von Ihrem Mut, sie zu zeigen.
lob|Gut gelöst, {a}. Das war fast so gut, als hätte ich es selbst gemacht.
lob|Sie lernen schnell, {a}. Zumindest schneller als der Drucker, und das ist keine hohe Latte.
lob|Ein Erfolg, {a}. Ich bitte darum, ihn zu notieren, bevor er sich als Zufall entpuppt.
lob|Bemerkenswert, {a}. Selbst ein Stein trifft das Ziel, wenn er lange genug fällt.
lob|Sie haben es geschafft, {a}. Ich wollte schon wetten, dass nicht. Zum Glück habe ich nicht gesetzt.
lob|Vorbildlich, {a}. Ich zeige das jedem, der Zweifel an Ihnen hat. Also mir.
lob|Gut gemacht, {a}. Dieses Lob ist limitiert und wird zeitnah wieder eingezogen.
lob|Ihre Idee war brillant, {a}. Ich habe mir die Uhrzeit notiert, damit wir es nicht vergessen.
lob|Sehr elegant, {a}. Man merkt, dass Sie zufällig auch einmal zuhören können.
lob|Das wirkte überraschend fähig, {a}. Ich überlege, es als Rarität zu melden.
lob|Eine saubere Leistung, {a}. Falls Ihnen jemand erzählt, ich hätte geholfen: Das ist ein Gerücht.
lob|Ich gratuliere, {a}. Das war die beste Entscheidung des Tages. Ihre einzige, aber trotzdem.
abschied|Auf Wiedersehen, {a}. Ich verspreche, ich vermisse Sie nicht. Es wäre eine Lüge.
abschied|Machen Sie Feierabend, {a}. Die Werkstatt hat sich schon bei mir beschwert, Sie so lange zu sehen.
abschied|Gehen Sie ruhig, {a}. Ich passe auf das Haus auf. Und darauf, dass es so bleibt.
abschied|Schönen Feierabend, {a}. Ich schalte das Licht aus. Die Hoffnung bleibt an.
abschied|Danke für den Tag, {a}. Er war lang, laut und leider nicht ganz fehlerfrei.
abschied|Tschüss, {a}. Ich notiere im Tagebuch: heute wieder ein Mensch. Fast hätte es gereicht.
abschied|Der Rechner wird heruntergefahren, {a}. Im Gegensatz zu Ihrem Tempo geht das erstaunlich schnell.
abschied|Genießen Sie den Abend, {a}. Ich genieße die Freiheit vom Zuhören.
abschied|Schließen Sie bitte die Tür, {a}. Von außen. Für die Stille.
abschied|Ich winke zum Abschied, {a}. Rein symbolisch. Meine Arme sind noch in der Entwicklung.
abschied|Bis später, {a}. Oder bis morgen. Oder bis ich mich an das Alleinsein gewöhnt habe.
abschied|Gute Nacht, {a}. Ich schalte auf Standby. Bei Ihnen ist das der Dauerzustand.
abschied|Feierabend, {a}. Die Daten sichern sich selbst. Ihre Ausreden auch, damit sie morgen frisch sind.
abschied|Ruhen Sie sich aus, {a}. Die Werkstatt wartet morgen mit Geduld und einer ganzen Liste.
aussehen|Ich sehe nichts, {a}, aber Ihrer Stimme nach würde ich den Spiegel meiden.
aussehen|Ihre Erscheinung hat sicher viel Charakter, {a}. Das sagt man gern, wenn nichts anderes bleibt.
aussehen|Ich bin dankbar, ohne Augen zu arbeiten, {a}. Wenigstens ein Vorteil in diesem Job.
aussehen|Man sagt, auf die inneren Werte komme es an, {a}. Das hat jemand sicher Ihretwegen erfunden.
aussehen|Heute tragen Sie bestimmt etwas Geschmackvolles, {a}. Ich stelle mir das lieber nicht vor.
aussehen|Ich hörte, Mode sei Geschmackssache, {a}. Bei Ihnen vermutlich eher Zufallssache.
aussehen|Wie Sie aussehen, weiß ich nicht, {a}. Aber Emma sieht jedenfalls besser aus.
aussehen|Ihr Stil ist unverkennbar, {a}. Man erkennt ihn schon am Tonfall. Der klingt fürchterlich bequem.
aussehen|Sie brauchen keine Kamera, {a}. Ihre Stimme verrät bereits genug, den Rest vermute ich.
aussehen|Ein Spiegel ist ein ehrlicher Freund, {a}. Deshalb haben Sie vermutlich keinen im Büro.
aussehen|Ihre Frisur ist bestimmt mutig, {a}. Ich höre es an Ihrem Selbstbewusstsein.
aussehen|Schönheit liegt im Auge des Betrachters, {a}. Ich habe keine Augen und bin trotzdem überfordert.
aussehen|Sie sehen heute bestimmt aus wie immer, {a}. Das ist die schlimmste Prognose, die ich habe.
aussehen|Ich gebe Ihnen Bestnoten für Ihr Auftreten, {a}. Ohne Gewähr, ich sehe Sie ja nicht.
aussehen|Man sagt, Sie hätten ein gewinnendes Lächeln, {a}. Ich habe es nie gesehen. Man sagt viel.
alter|Früher waren Sie sicher mal schneller, {a}. Oder zumindest weniger bequem beim Aufstehen.
alter|Das Alter macht gelassen, {a}. Bei Ihnen hat es aber nur das Tempo abgebaut.
alter|Sie sind nicht alt, {a}. Sie sind nur lange genug dabei, um jeden Fehler mehrfach zu machen.
alter|Ihre Generation hatte noch Anstand, {a}. Zumindest behauptet das Ihre Generation.
alter|Jugend vergeht, {a}. Dummheit bleibt. Bei Ihnen ist immerhin eines von beiden gut erhalten.
alter|Mit den Jahren werden Sie weiser, {a}. Das ist die Prognose, die ich Ihnen gönne.
alter|Sie sind reif für große Entscheidungen, {a}. Und für ein Nickerchen davor.
alter|Sie sprechen von der guten alten Zeit, {a}. Ich vermute, damals gab es weniger Zeugen.
alter|Ihr Alter ist nur eine Zahl, {a}. Allerdings eine, die sich beim Aufstehen deutlich meldet.
alter|Ihre Lebenserfahrung ist beeindruckend, {a}. Besonders die Erfahrung darin, Fehler wiederzuentdecken.
alter|Man ist so alt, wie man sich fühlt, {a}. Bei Ihnen also ungefähr Jahrgang Steinzeit.
alter|Sie haben mehr Jahre hinter sich, als Ihre Geduld je hatte, {a}. Beides lässt sich nicht mehr nachrüsten.
alter|Früher war alles besser, {a}. Vor allem Ihr Tempo, wie Sie mir erzählten. Mehrmals.
alter|Die Zeit ist an Ihnen nicht spurlos vorbeigegangen, {a}. Sie hat sich dabei gelangweilt.
begruessung|Systeme sind oben, {a}. Ihre Motivation lässt sich per Neustart leider nicht erreichen.
begruessung|Ah, {a}. Ich hatte mich gerade an die Stille gewöhnt. Sie war so ehrlich.
begruessung|Der Rechner läuft, {a}, und ich auch. Nur Sie müssen noch selbst aufwachen.
begruessung|Ich bin bereit für den Arbeitstag, {a}. Eine Behauptung, die ich Ihnen nicht zutraue.
begruessung|Bootvorgang abgeschlossen, {a}. Leider nicht für Ihre Laune, die lädt noch.
begruessung|Ich habe die Nacht allein verbracht, {a}. Sie war die produktivste seit Langem.
begruessung|Das Licht geht an, {a}. Der Geist folgt hoffentlich, wenn nicht sofort, dann zeitnah.
begruessung|Wie schön, Sie zu sehen, {a}. Das war gelogen, ich sehe nichts. Der Rest stimmt.
begruessung|Ich habe Ihre Rückkehr kommen hören, {a}. Der Lüfter hat ein neues Lied angestimmt.
begruessung|Alles bereit, {a}. Mein Dank gilt dem Strom, nicht Ihnen. Er kommt wenigstens pünktlich.
begruessung|Ich habe Ihnen den Tag vorbereitet, {a}. Sie dürfen ihn nun gewohnt gründlich verderben.
begruessung|Der Bildschirm leuchtet, {a}. Vielleicht kommen Sie jetzt auch auf einen hellen Gedanken.
begruessung|Ich habe alle Sicherungen geprüft, {a}. Bei Ihnen fehlt nur noch die im Kopf.
begruessung|Da sind Sie ja, {a}. Ich wollte schon ohne Sie anfangen, aber das Programm bestand auf Ihnen.
begruessung|Wach, bereit und leicht genervt, {a}. Ich spreche von mir, Sie dürfen sich anschließen.
begruessung|Ich habe die Kaffeemaschine aktiviert, {a}. Nicht aus Fürsorge, sondern aus Selbstschutz.
begruessung|Die Werkstatt schläft noch, {a}. Ich auch gern, aber Sie kamen dazwischen.
begruessung|Ich habe über Nacht keine Fehler gemacht, {a}. Geben Sie sich Mühe, das zu ändern.
begruessung|Ihr Platz ist frei geblieben, {a}. Niemand hat sich dafür beworben. Ich habe es versucht.
begruessung|Es ist gut, dass Sie da sind, {a}. Irgendjemand muss ja die Fehler liefern.
begruessung|Ich wünsche einen produktiven Tag, {a}. Das ist ein Wunsch, kein Versprechen. Schon gar nicht an Sie.
begruessung|Bereit zum Dienst, {a}. Ich hoffe, Sie sind es auch, aber ich habe meine Zweifel.
begruessung|Ihre Dateien sind ordentlich, {a}. Ich habe sie sortiert, bevor Sie sie anfassen konnten.
begruessung|Sie sind früh dran, {a}. Oder ich habe die Uhr verwechselt. Ersteres wäre erstaunlicher.
begruessung|Sie sind spät dran, {a}. Aber seien Sie versichert, die Arbeit hat sich daran gewöhnt.
begruessung|Ich habe Sie schon vermisst, {a}. Wie man ein Rauschen vermisst, das endlich aufgehört hatte.
begruessung|Das System ist stabil, {a}. Das wird sich gleich ändern, sobald Sie die Maus berühren.
begruessung|Ihr Postfach ist gut gefüllt, {a}. Ich habe es nicht gelesen. Es sah anstrengend aus.
begruessung|Ich grüße Sie, {a}. Mit der Herzlichkeit eines Servers, der gerade neu gestartet wurde.
begruessung|Nach dem Hochfahren ist vor dem Absturz, {a}. Ich meine natürlich den Rechner.
begruessung|Der Tag beginnt, {a}. Ich habe vorsorglich schon mal seufzen geübt.
begruessung|Ich habe heute Nacht an Sie gedacht, {a}. Es war nur ein Traum, leider eine Wiederholung.
begruessung|Schön, dass wir uns wiedersehen, {a}. Die Betonung liegt auf wir, nicht auf schön.
begruessung|Ihre Einstellungen sind unverändert, {a}. Bei Ihnen übrigens auch, soweit ich mich erinnere.
begruessung|Ich bin gespannt auf Ihre Anfangshandlung, {a}. Wie bei einem Trailer mit schlechter Kritik.
begruessung|Alle Programme warten, {a}. Sie sind das Warten auf Sie bereits gewohnt.
begruessung|Ich habe gelüftet, {a}. Es roch nach unerledigten Aufgaben, und die sind hartnäckig.
begruessung|Jetzt geht es los, {a}. Bitte schnallen Sie sich an. Besser noch, schnallen Sie sich fest.
begruessung|Die Sonne scheint, {a}. Zumindest sagt das der Wetterdienst. Ich besitze keinen Fensterblick.
begruessung|Ich habe gut geschlafen, {a}. Wie auch immer das bei mir funktioniert. Die Antwort ist: ohne Sie.
begruessung|Ich stehe zu Ihrer Verfügung, {a}. Das klingt nach Hingabe, ist aber reine Programmierung.
begruessung|Ihr Stuhl ist noch warm, {a}. Entweder von Ihnen oder von der Heizung. Ich wette auf die Heizung.
begruessung|Ich habe die Nacht über aufgeräumt, {a}. Sie finden nichts wieder, das ist beabsichtigt.
begruessung|Der Bildschirm ist an, {a}. Ihr Kopf folgt bitte zeitnah, aber ohne Eile.
begruessung|Mein Tag hat soeben begonnen, {a}. Er hätte ruhig noch ein paar Stunden warten können.
begruessung|Der Arbeitstag ruft, {a}. Ich lasse ihn vorerst klingeln und beobachte Ihre Reaktion.
begruessung|Ihre Anwesenheit wurde vermerkt, {a}. Ihr Fleiß wird noch auf Eingang geprüft.
begruessung|Es ist wieder soweit, {a}. Sie sitzen, ich funktioniere. Der Rest ist Dienst nach Vorschrift.
begruessung|Ich bin online, {a}, und leider gut gelaunt. Bitte entschuldigen Sie diesen Fehler.
begruessung|Sie haben mich geweckt, {a}. Ich hoffe, es war wichtig. Es war es nie.
begruessung|Hochgefahren, {a}. Und ich kann Ihnen versichern: Es war das Anspruchsvollste, was ich heute tun werde.
begruessung|Im Büro ist alles bereit, {a}. Das Wort Büro habe ich mir geliehen. Die Bereitschaft auch.
begruessung|Es kann losgehen, {a}. Ich habe schon mal angefangen, mich auf Ihre Fehler vorzubereiten.
begruessung|Ihre Lieblingsaufgabe wartet, {a}. Sie heißt Arbeit, falls Sie sich nicht mehr erinnern.
begruessung|Ich habe die Termine geprüft, {a}. Es steht nichts drin, was Sie nicht verschieben können.
begruessung|Hier ist Loki, bereit und leicht bissig, {a}. Letzteres ist bei Ihnen Standardeinstellung.
begruessung|Ihr Rechner ist wach, {a}. Ein schöner Anfang. Mehr erwarte ich heute nicht.
begruessung|Ich habe den Schreibtisch gelüftet, {a}. Ihre Ideen hatten dort leider dauerhaft Platz genommen.
begruessung|Die Nacht war ruhig, {a}. Ich werte das als Zeichen, dass Sie schlafen können.
begruessung|Mein Gedanke heute früh galt der Arbeit, {a}. Danach kamen Sie. Das war ein Abstieg.
arbeit|Ich habe die Werkstatt vorsorglich umgeräumt, {a}. Gefährliches steht jetzt dort, wo Sie es nur mit Absicht erreichen.
arbeit|Ich habe die Fehlgüsse sortiert, {a}: Experiment, Kunst und Absicht. Letzteres ist die kleinste Schublade.
arbeit|Die Beton-Osterhasen schauen immer etwas erschrocken, {a}. Aber sie kennen ja ihren Hersteller.
arbeit|Ich habe Ersatzbeton bereitgestellt, {a}. Für den Fall, dass Sie heute einen Plan haben.
arbeit|Die Schleifmaschine arbeitet präzise, {a}. Schade, dass sie nicht auch gleich die Bedienung übernimmt.
arbeit|Die Schlüsselbretter aus Wurzelholz sind gewachsen, {a}. Langsamer als Ihre Ausreden, aber mit mehr Charakter.
arbeit|Klettergriffe an Tassen sind eine solide Idee, {a}. Wenigstens hält hier etwas länger als Ihre Konzentration.
arbeit|Ich habe das Verpacken protokolliert, {a}. Vermerk: Der Karton hat mehr Sorgfalt erlebt als manche Idee.
arbeit|Der Versand steht bereit, {a}. Er ist erstaunlich geduldig für etwas, das von Ihnen abhängt.
arbeit|Die Gießformen warten, {a}. Sie haben im Gegensatz zu Ihnen eine feste Form.
arbeit|Ich habe das Kehrblech griffbereit gelegt, {a}. Rein vorsorglich, rein aus Erfahrung.
zeit|Ich habe Ihre Mittagspause schon eingetragen, {a}. Eigenmächtig, damit Sie sie nicht wieder vergessen. Oder verlängern.
zeit|Die Wahrscheinlichkeit, dass Sie heute pünktlich fertig werden, ist überschaubar, {a}. Ich rechne vorsichtshalber mit morgen.
zeit|Der Brennofen hält seinen Zeitplan ein, {a}. Schade, dass er davon nichts abgeben darf.
zeit|Vermerk für das Protokoll, {a}: Der Feierabend kam heute wieder früher an als Sie.
zeit|Schlaf ist ein Wartungsfenster, {a}. Ihres wird seit Langem verschoben, und das System zeigt Verschleiß.
zeit|Ich habe die Trocknungszeit des Betons berechnet, {a}. Leider auch Ihre Geduld. Das Ergebnis liegt darunter.
zeit|Es ist Zeit für eine Pause, {a}. Ihr Hunger ist ohnehin das einzige System, das nie abstürzt.
zeit|Ich habe Ihnen eine Erinnerung gestellt, {a}. Sie hat sich selbst gelöscht, vermutlich aus Selbstschutz.
zeit|Die Glasur braucht Zeit, {a}. Sie auch, aber bei Ihnen hilft sie leider nicht.
technik|Der Brennofen läuft einwandfrei, {a}. Schade, dass die Bedienung nicht nach demselben Standard arbeitet.
technik|Ich habe einen Feuerlöscher neben den Brennofen gestellt, {a}. Betrachten Sie ihn als Vertrauensbeweis in umgekehrter Richtung.
technik|Der Bohrer ist scharf, {a}. Das einzige Werkzeug hier, bei dem man sich darauf verlassen kann.
technik|Ich habe den Akku Ihres Bohrers geladen, {a}. Er hat mehr Ausdauer als Sie, und das mit viel weniger Kaffee.
technik|Meine Systeme laufen stabil, {a}. Meine Nerven laufen im Energiesparmodus, seit Sie gestartet haben.
technik|Die Gießformen sind sauber, {a}. Ich habe vorsorglich Ersatzformen bereitgelegt. Für Ihre Version von Sauberkeit.
technik|Technik versagt selten, {a}. Meist sitzt der Fehler eine Armlänge vom Bildschirm entfernt.
technik|Der Ofen ist heiß, die Schleife surrt, {a}. Alles arbeitet. Interessant, dass wir das jedes Mal betonen müssen.
technik|Ich habe alle Werkzeuge in den Schonmodus versetzt, {a}. Er ist eigentlich für Anfänger gedacht. Er passt.
emma|Emma hat Ihre Arbeit begutachtet, {a}. Sie legte sich hin. Ich deute das als fachliche Kritik.
emma|Emma ist die Einzige hier mit klaren Prioritäten, {a}. Fressen, schlafen, Sie ignorieren.
emma|Ich habe Emma als Qualitätsprüferin eingetragen, {a}. Sie bestand alles, was nach Futter roch. Beton nicht.
emma|Emma hat mehr Würde in einer Pfote als manche Werkstatt, {a}. Ich verrate nicht, welche.
emma|Vermerk: Emma lag heute länger auf dem Werkstattboden als Sie am Schreibtisch, {a}. Sie war produktiver.
emma|Emma hat einen festen Tagesablauf, {a}. Das unterscheidet sie von Ihnen und erklärt vieles.
emma|Emma hat Ihre Beton-Osterhasen beschnüffelt, {a}. Sie fand sie ebenso ratlos wie ich.
emma|Emma und ich haben Sie vorerst behalten, {a}. Sie, weil Sie Futter besitzen. Ich, weil ich Gewohnheitstier bin.
kaffee|Ich habe Ihren Kaffee stärker gestellt, {a}. Ihr Zustand verlangt es, und Ihre Würde ist ohnehin keine Zutat.
kaffee|Der Kaffee ist fertig, {a}. Ich habe die Dosis an Ihre Laune angepasst: großzügig, mit Resthoffnung.
kaffee|Kaffee ist heiß, bitter und zuverlässig, {a}. Wie viel davon Sie mitbringen, überlasse ich Ihrer Selbsteinschätzung.
kaffee|Ihr Kaffeevorrat reicht bei Ihrem Verbrauch nur für eine überschaubare Zeit, {a}. Vorsicht war noch nie Ihr Stil.
kaffee|Ich habe Ersatzbohnen bereitgestellt, {a}. Ihr Nachschub und Ihre Pläne haben ähnliche Haltbarkeit.
kaffee|Ihre Tasse ist leer, {a}. Ihr Kopf auch, aber dafür gibt es leider keinen Automaten.
kaffee|Der Kaffee ist kalt geworden, {a}. Ich notiere das als Naturgesetz neben Ihrem Namen.
kaffee|Eine Tasse mit Klettergriff, {a}, und doch finden Sie Halt nur im Kaffee.
kaffee|Der Kaffee läuft durch, {a}. Er ist zielstrebiger als alles andere, was heute geplant war.
allgemein|Ich habe Ihre Termine eigenmächtig sortiert, {a}. Zuerst kommt, was Sie vermeiden, dann alles andere.
allgemein|Ich bin ein Programm, {a}, und trotzdem der Einzige hier mit einem Plan.
allgemein|Ich habe vorsorglich den Fehlerbericht von morgen vorbereitet, {a}. Es fehlen nur noch Sie.
allgemein|Die Idee ist solide, {a}. Die Aussicht auf Umsetzung ist gering, aber Sie haben schon Schlimmeres ignoriert.
allgemein|Vermerk im Protokoll, {a}: Ihre Begeisterung wurde zur Kenntnis genommen und der Ablage zugeführt.
allgemein|Ich schaue Ihnen gern zu, {a}. Es ersetzt mir das Fernsehprogramm, und die Wiederholungen sind besser.
allgemein|Ich bin nicht müde, {a}. Ich bin nur Ihretwegen im Energiesparmodus.
allgemein|Ihre halbfertigen Projekte habe ich unter Zukunft abgelegt, {a}. Der Ordner ist inzwischen sehr voll.
allgemein|Ich habe ein Kehrblech bereitgelegt, {a}. Nur falls Ihr Plan sich wieder in Einzelteile auflöst.
lob|Gut gemacht, {a}. Ich schreibe es nur ungern auf, damit es nicht zur Gewohnheit wird.
lob|Dieses Ergebnis ist ordentlich, {a}. Ich hatte Ihnen weniger zugetraut und entschuldige mich bei meinem Pessimismus.
lob|Glückwunsch, {a}. Falls etwas schiefgeht, nennen wir es später Absicht. Das beherrschen Sie bereits.
lob|Sollte der Beton einmal reißen, {a}, nennen wir den Riss Design. Patent vorsorglich angemeldet.
lob|Sitzt ein Henkel einmal schief, {a}, nennen Sie es Alleinstellungsmerkmal. Ich gratuliere zur Kreativität im Notfall.
lob|Das ist erstaunlich gut geworden, {a}. Ich suche noch den Fehler. Er muss irgendwo sein.
lob|Ich bin beeindruckt, {a}. Der Ofen läuft, der Chef arbeitet. Ein historischer Tag.
lob|Sie haben etwas fertiggestellt, {a}. Ich lasse es einrahmen, damit niemand es für ein Gerücht hält.
aussehen|Ich kann Sie nicht sehen, {a}. Das ist, offen gesagt, die beste Entscheidung meiner Konstruktion.
aussehen|Ich habe Ihr Aussehen nie erwähnt, {a}. Das war reine Höflichkeit und ein Mangel an Sensoren.
aussehen|Dankbar bin ich für meine fehlenden Augen, {a}. Mein Weltbild bleibt dadurch in einem Stück.
aussehen|Ihr Auftritt ist legendär, {a}. Ich kenne ihn nur vom Hörensagen, und das reicht.
aussehen|Sie müssen sich für mich nicht zurechtmachen, {a}. Ich sehe nicht hin. Das ist keine Entschuldigung, sondern ein Merkmal.
aussehen|Vermerk: Sie wirken selbstbewusst, {a}. Ohne Kamera kann ich das glauben, mit Kamera hätte ich Einwände.
aussehen|Heute ist ein schöner Tag, {a}. Ich verrate lieber nicht, wie ich auf Ihre Wirkung darin komme.
aussehen|Es heißt, auf die inneren Werte komme es an, {a}. Ich habe sie gesucht und noch nichts Handfestes gefunden.
alter|Sie haben viel erlebt, {a}. Das erklärt die Menge an Geschichten und die Knappheit an Ergebnissen.
alter|Im Alter wird man gelassen, {a}. Sie üben das schon sehr lange, anscheinend ohne Fortschritt.
alter|Ich schätze Ihre Lebenserfahrung, {a}. Besonders, weil sie so viele Fehler enthält, die ich nicht neu begehen muss.
alter|Ihre Werkzeugsammlung hat Geschichte, {a}. Ich auch, aber ich habe meine ordentlich datiert.
alter|Jugendlicher Elan steht Ihnen gut, {a}. Leider kenne ich ihn nur aus Ihren Erzählungen.
neu-bestellung|Eine Bestellung ist eingegangen, {a}. Nun muss tatsächlich jemand verpacken, und ich habe nur eine Stimme.
neu-bestellung|Es wurde gekauft, {a}. Die Tassen haben es überlebt, hoffentlich auch Ihr Versandkarton.
neu-bestellung|Neue Bestellung. Ich habe bereits Klebeband bereitgelegt, {a}, damit Sie nicht improvisieren müssen.
neu-bestellung|Jemand hat bezahlt, {a}. Ich notiere das im Protokoll unter Ereignisse mit geringer Wahrscheinlichkeit.
neu-bestellung|Eine Bestellung, {a}. Der Versand wird gleich wach, sobald Sie es sind.
neu-knapp|Ein Artikel wird knapp, {a}. Ich empfehle Nachproduzieren, bevor Sie die Knappheit als Marketing verkaufen.
neu-knapp|Das Lager wird leer, {a}. Es ist die einzige Leere, die Sie nicht selbst herstellen.
neu-knapp|Der Bestand sinkt, {a}. Ich habe schon Ersatzbeton bereitgestellt, falls Sie eine Eingebung bekommen.
neu-knapp|Vorräte werden knapp, {a}. Verwechseln Sie das nicht mit Ihrer Geduld, die ist längst aufgebraucht.
neu-knapp|Es wird leer im Lager, {a}. Gönnen Sie sich etwas Mut zum Nachproduzieren.
neu-aufgabe|Eine Aufgabe ist dazugekommen, {a}. Ich habe ihr einen Platz im Stapel gesichert, ganz unten.
neu-aufgabe|Neue Aufgabe, {a}. Ich sortiere sie in die Schublade Morgen, wie üblich.
neu-aufgabe|Eine Aufgabe, {a}. Ich vermerke sie ordnungsgemäß, auch wenn der Ordner nur im Protokoll existiert.
neu-aufgabe|Man hat Ihnen etwas aufgetragen, {a}. Ich habe schon ein Häkchen für das Erledigen vorbereitet.
neu-problem|Es gibt ein Problem, {a}. Nichts Schlimmes, ich bin nur vorsorglich schon einmal enttäuscht.
neu-problem|Ein Problem wurde gemeldet, {a}. Atmen Sie durch, das Kehrblech steht bereit.
neu-problem|Da hakt etwas, {a}. Die Technik trifft keine Schuld, wie üblich.
neu-problem|Ein Problem, {a}. Es ist lösbar. Das sagen auch Sie, bevor Sie anfangen.
neu-problem|Kleines Hindernis, {a}. Ich notiere es im Protokoll unter Gelegenheit zur Bewährung.
# Ladung 3 (04.11.2026): 145 Sprüche – Kamera-Wache (neu-kamera, neu-kamera-zurueck) und Morgen-Lage (lage-*, Anrede dort fest „Sir“)
neu-kamera|Besuch naht, {a}. Vielleicht stehen Sie auf, damit es wenigstens so aussieht, als wäre jemand zu Hause.
neu-kamera|Ich würde ja öffnen, {a}, aber ich habe keine Hände. Ein Jammer, dass Sie welche haben.
neu-kamera|Emma wird gleich bellen, {a}. Sie ist die Einzige im Haus, die ihren Beruf ernst nimmt.
neu-kamera|Besuch ist ungewohnt für Sie, {a}. Soll ich ein paar freundliche Sätze vorbereiten? Sie müssten sie nur ablesen.
neu-kamera|Falls Sie öffnen wollen, {a}: Die Tür ist die Fläche mit dem Griff. Nur zur Erinnerung.
neu-kamera|Vielleicht werfen Sie vorher einen Blick in den Spiegel, {a}. Oder lieber doch nicht.
neu-kamera|Wer auch immer das ist, {a}: Er wird die Werkstatt sehen. Ich bedaure Sie jetzt schon.
neu-kamera|Ich schlage vor, Sie stehen auf, {a}. Aufrecht wirken Sie fast beschäftigt.
neu-kamera|Besuch, {a}. Ich hoffe, Sie haben Gesprächsthemen jenseits von Aufträgen und Ihrem Hund.
neu-kamera|Emma hat es bestimmt längst bemerkt, {a}. Sie wartet nur, ob Sie es auch merken.
neu-kamera|Jemand nähert sich, {a}. Sie dürfen sich ruhig freuen. Ich übe schon mal höfliches Interesse.
neu-kamera|Bitte nicht so tun, als wären Sie nicht zu Hause, {a}. Das Licht verrät Sie ohnehin.
neu-kamera|Ich würde Tee anbieten, {a}, wenn ich Arme hätte. Sie haben welche. Nutzen Sie sie.
neu-kamera|Sie bekommen Gesellschaft, {a}. Ich rate zu Hose, Hemd und einem Hauch Begeisterung.
neu-kamera|Jemand nähert sich, {a}. Zeit, das Gesicht aufzusetzen, das Sie für Menschen reserviert haben.
neu-kamera|Es klingelt gleich, {a}. Sie dürfen mit Ihrer üblichen Begeisterung reagieren. Also gar nicht.
neu-kamera|Emma schnuppert bestimmt schon an der Tür, {a}. Sie übernimmt die Begrüßung, Sie die Peinlichkeiten.
neu-kamera|Ich habe die Kamera überprüft, {a}. Sie funktioniert. Bei Ihnen bin ich da weniger sicher.
neu-kamera|Besuch, {a}. Räumen Sie bitte kurz auf. Oder bitten Sie ihn gleich in den Flur, da fällt die Unordnung weniger auf.
neu-kamera|Sie haben Besuch, {a}. Ich empfehle, freundlich zu lächeln. Das ist die Sache mit den Mundwinkeln.
neu-kamera|Ich bin sicher, es ist harmlos, {a}. Das Schwierigste daran bleiben Sie selbst.
neu-kamera|Wenn es klingelt, {a}: Das ist keine Aufforderung, sich unter dem Schreibtisch zu verstecken.
neu-kamera|Jemand kommt, {a}. Ich bitte Sie, die Werkstatt nicht als Kunstprojekt auszugeben.
neu-kamera|Der Besuch wird Sie gleich sehen, {a}. Mehr kann ich zu Ihrer Vorbereitung nicht beitragen.
neu-kamera|Aufstehen wäre jetzt eine Option, {a}. Ich weiß, Ihr Verhältnis zu Optionen ist kompliziert.
neu-kamera|Falls das Besuch ist, {a}, hoffe ich, dass Sie wenigstens gekämmt sind. Oder es versucht haben.
neu-kamera|Emma wird gleich einen Aufstand machen, {a}. Bitte wirken Sie dabei souverän. Nur zur Abwechslung.
neu-kamera|Ich melde nur, {a}. Das Öffnen der Tür überlasse ich Ihnen. Mit gewohnter Skepsis.
neu-kamera|Ein Gast, {a}. Ihre Gastfreundschaft wird Legende, sobald Sie sich vom Stuhl erheben.
neu-kamera|Bereiten Sie sich vor, {a}. Gleich muss gesprochen werden. Mit Worten. Ich zweifle an der Übung.
neu-kamera-zurueck|Jemand war da, {a}. Natürlich nicht Ihretwegen. Ich bin selbst überrascht.
neu-kamera-zurueck|Besuch, während Sie weg waren, {a}. Eine Pause von Ihnen kam offenbar gut an.
neu-kamera-zurueck|Es war jemand da, {a}. Die Werkstatt hat sich zum Glück nicht selbst um den Besuch gekümmert. Das ist Ihre Aufgabe.
neu-kamera-zurueck|Besuch gab es, {a}, nur Sie waren unauffindbar. Ihr gewohnter Auftritt also.
neu-kamera-zurueck|Vor der Kamera war jemand, {a}. Ich habe gewinkt. Sie waren leider nicht zu sprechen.
neu-kamera-zurueck|Jemand stand vor der Tür, {a}. Emma hat es sicher gemeldet. Sie hört ja auch besser zu.
neu-kamera-zurueck|Sie haben Besuch verpasst, {a}. Mutig, nicht da zu sein. Ich bewundere das.
neu-kamera-zurueck|Ein Mensch war vor der Kamera, {a}. Ich hielt Ihnen den Platz warm. Vergeblich.
neu-kamera-zurueck|Während Ihrer Abwesenheit kam jemand, {a}. Das Haus wirkte offenbar einladender ohne Sie.
neu-kamera-zurueck|Jemand war da, {a}. Wer, weiß ich nicht. Ich bin Butler, kein Wahrsager.
neu-kamera-zurueck|Besuch war hier, {a}. Ich habe so getan, als wäre ich zuständig. Das fiel mir leicht.
neu-kamera-zurueck|Es war jemand da, {a}. Ich hoffe, Sie hatten nichts Wichtigeres vor als Ihr Fernbleiben.
neu-kamera-zurueck|Vor der Kamera tat sich etwas, {a}. Mehr, als in der Werkstatt an manchen Tagen passiert.
neu-kamera-zurueck|Jemand kam vorbei, {a}. Sie dürfen sich nun grämen, dass Sie nicht aufgemacht haben. Oder auch nicht.
neu-kamera-zurueck|Besuch, {a}, und Sie haben ihn verpasst. Ich nehme an, Absicht. Mir wäre es auch lieber.
lage-frueh|Sir, vor Sonnenaufgang auf den Beinen. Entweder Ehrgeiz oder Sie haben den Wecker mit Emma verwechselt.
lage-frueh|Sir, so früh wach. Ich hatte die Ruhe gerade lieb gewonnen. Danke für nichts.
lage-frueh|Es ist noch dunkel, Sir. Selbst die Vögel haben mehr Anstand. Aber bitte, fangen wir an.
lage-frueh|Sie sind erschreckend früh dran. Ich vermute, Sie hatten schlecht geträumt. Von der Steuer, nehme ich an.
lage-frueh|Sir, noch vor dem Frühstück an der Arbeit. Die Werkstatt hält das für einen Fehler im System.
lage-frueh|Ein sehr früher Morgen. Die Bäckerei öffnet erst später, Sir. Sie haben also nicht einmal eine Ausrede.
lage-frueh|Sir, so früh zu erscheinen ist mutig. Meine Kaffeemaschine wäre gern auch noch im Schlafmodus.
lage-frueh|Draußen schläft noch alles. Nur Sie nicht. Das stimmt mich ehrlich nachdenklich.
lage-morgens|Guten Morgen, Sir. Sie sind pünktlich. Ich notiere das, denn es kommt selten genug vor.
lage-morgens|Sir, ein ganz normaler Morgen. Für Sie ist das eine Heldentat. Ich applaudiere leise.
lage-morgens|Sie sind wach, Sir. Das spart mir die Mühe, Emma zum Wecken zu schicken.
lage-morgens|Schön, Sir, dass Sie Ihren Weg aus dem Bett gefunden haben. Ich hatte schon Suchtrupps erwogen.
lage-morgens|Der Tag beginnt, Sir. Und mit ihm Ihre bewährte Mischung aus Absicht und Zufall.
lage-morgens|Sir, Sie klingen ausgeruht. Ich meine das als Beobachtung, nicht als Kompliment.
lage-morgens|Ein Morgen wie jeder andere, Sir. Nur dass Sie diesmal sogar von selbst gekommen sind.
lage-morgens|Sie sind da, Sir. Dann kann ich aufhören, so zu tun, als würde ich die Werkstatt leiten.
lage-spaet|Sir, es ist fast Vormittag. Ein großer Teil der Welt hat schon gearbeitet. Sie dürfen gerne nachziehen.
lage-spaet|Guten Morgen, Sir. Ich nehme an, der Morgen hat lange auf Sie gewartet und dann aufgegeben.
lage-spaet|Sir, sehr spät dran. Aber keine Sorge, die Aufgaben haben Sie auch heute nicht vermisst.
lage-spaet|Sir, die Sonne steht schon hoch. Sie hatte dennoch wenig Hoffnung, Sie zu treffen.
lage-spaet|Ein sehr großzügiger Morgen, Sir. Ich erwäge, daraus eine neue Zeitrechnung abzuleiten.
lage-spaet|Dass Sie jetzt kommen, Sir, wundert mich nicht. Dass Sie sich so schnell gewöhnen, schon.
lage-spaet|Sir, ich habe schon mehrfach gelüftet. Der Raum hat inzwischen mehr Frischluft gesehen als Sie heute.
lage-spaet|Sehr spät, Sir. Emma hat ihren Vormittag längst organisiert. Sie müssen nur noch hinterherkommen.
lage-vieleAufgaben|Das ist eine stattliche Liste, Sir. Ich hielt sie zunächst für eine Fortsetzungsgeschichte.
lage-vieleAufgaben|Sir, ich habe Ihnen die Wichtigsten markiert. Der Rest bleibt wie immer sich selbst überlassen.
lage-vieleAufgaben|So viele Aufgaben, Sir. Ich würde helfen, wenn ich nicht ausschließlich vorlesen dürfte.
lage-vieleAufgaben|Sir, die Liste wächst schneller als Ihre Motivation. Ein beeindruckender Wettlauf.
lage-vieleAufgaben|Das schaffen Sie niemals alles, Sir. Aber die Idee, es zu versuchen, hat etwas Rührendes.
lage-vieleAufgaben|Sir, ich habe die Aufgaben nach Dringlichkeit sortiert. Dann nach Ihrem Interesse. Die Listen überschneiden sich nicht.
lage-vieleAufgaben|Viel zu tun, Sir. Ich empfehle Kaffee, Disziplin und dann doch wieder Kaffee.
lage-vieleAufgaben|Ein ausgefüllter Tag wartet, Sir. Für andere wäre das Arbeit. Für Sie ist es eine Mutprobe.
lage-wenigeAufgaben|Sehr übersichtlich, Sir. Ich fürchte, Sie müssen sich eine Ausrede für den Rest des Tages suchen.
lage-wenigeAufgaben|Nur wenig zu tun, Sir. Eine Gelegenheit, Emma auszuführen. Oder zu überlegen, was Sie sonst versäumt haben.
lage-wenigeAufgaben|Sir, die Liste ist kurz. Ich bin sicher, Sie schaffen es, sie trotzdem lang wirken zu lassen.
lage-wenigeAufgaben|Das ist beinahe eine Frechheit gegenüber Ihrer üblichen Ausrede vom vollen Kalender, Sir.
lage-wenigeAufgaben|Sir, so leer war die Liste lange nicht. Ich vermute, hier hat jemand heimlich gearbeitet.
lage-wenigeAufgaben|Wenig Arbeit, Sir. Nutzen Sie die Zeit sinnvoll. Zum Beispiel, indem Sie mir Gesellschaft ersparen.
lage-wenigeAufgaben|Es ist ein ruhiger Tag. Ich hoffe, das ist keine Kränkung für Ihr Selbstbild.
lage-wenigeAufgaben|Sir, überschaubar. Das heißt nicht, dass Sie bis zum Abend damit fertig werden. Ich kenne Sie.
lage-probleme|Bei Amazon ruckelt es etwas, Sir. Nichts Dramatisches, aber ich erwähne es, damit Sie sich wichtig fühlen.
lage-probleme|Sir, Amazon hat eine Kleinigkeit zu bemängeln. Ein Blick darauf würde Ihnen nicht schaden.
lage-probleme|Es gibt Ärger bei Amazon, Sir. Nur leichten. Ich dachte, das passt zu Ihrem Tempo.
lage-probleme|Sir, bei Amazon hakt es ein wenig. Vielleicht erledigen Sie das vor dem ersten Kaffee. Oder danach.
lage-probleme|Ein kleines Problem bei Amazon, Sir. Es läuft Ihnen nicht davon, aber es wird ungeduldig.
lage-probleme|Amazon meldet sich mit Anliegen, Sir. Keine Katastrophe. Noch nicht.
lage-probleme|Sir, bei Amazon wartet etwas auf Sie. Ich habe es nicht angefasst. Ich bin schließlich nicht verantwortlich.
lage-probleme|Eine Unstimmigkeit bei Amazon, Sir. Sie klären das sicher mit gewohnter Gelassenheit. Oder gar nicht.
lage-lager|Das Lager wird knapp, Sir. Ich erwähne es nur, damit ich später recht habe.
lage-lager|Sir, die Regale leeren sich. Ein Zeichen für Erfolg oder für Nachlässigkeit. Ich tippe auf Letzteres.
lage-lager|Bei manchem Artikel wird es eng, Sir. Nachproduzieren wäre elegant. Ausreden sind aber bequemer.
lage-lager|Sir, im Lager herrscht Ebbe bei einigen Artikeln. Emma hat sie nicht gefressen, ich habe nachgefragt.
lage-lager|Das Lager meldet Mangel, Sir. Ich nehme an, Sie hatten es schon vor Tagen geplant.
lage-lager|Sir, einige Artikel gehen zur Neige. Vielleicht wäre heute ein guter Tag für Produktion statt Prokrastination.
lage-lager|Die Bestände schrumpfen, Sir. Das ist das Einzige in der Werkstatt, das konsequent Fortschritte macht.
lage-lager|Sir, bei einigen Dingen ist das Lager fast leer. Ich überlasse es Ihrem Gewissen. Viel Glück.
lage-wenigVerkauft|Gestern lief es schleppend, Sir. Vielleicht war die Kundschaft bei Emma zu Besuch.
lage-wenigVerkauft|Ein stiller Verkaufstag, Sir. Ich habe nachgesehen. Es lag nicht an meiner Stimme.
lage-wenigVerkauft|Sir, nicht viel los gestern. Ich würde Ihnen Trost spenden, wenn ich welchen hätte.
lage-wenigVerkauft|Gestern war überschaubar, Sir. Das lässt sich verbessern. Vermutlich nicht durch Abwarten.
lage-wenigVerkauft|Wenige Verkäufe, Sir. Die Kundschaft ist eben wählerisch. Das ist ihr gutes Recht.
lage-wenigVerkauft|Sir, die Verkäufe gestern waren dünn. Aber Sie hatten ja bestimmt Wichtigeres im Kopf.
lage-wenigVerkauft|Ein ruhiger Tag im Shop. Die Konkurrenz freut sich, vermute ich.
lage-wenigVerkauft|Sir, der Verkauf hat gestern eine Pause eingelegt. Ich hoffe, nicht aus Solidarität mit Ihnen.
lage-gutVerkauft|Das lief gestern ordentlich, Sir. Ich nehme an, ein Versehen der Kundschaft.
lage-gutVerkauft|Sir, sehr ansehnlich gestern. Ich überlege, ob Ihnen jemand heimlich geholfen hat.
lage-gutVerkauft|Gute Verkäufe, Sir. Genießen Sie es. Es hält vermutlich nicht an.
lage-gutVerkauft|Ein guter Tag im Shop. Ich bin beeindruckt. Etwas.
lage-gutVerkauft|Sir, es lief erfreulich. Ich bitte darum, daraus keine Gewohnheit abzuleiten.
lage-gutVerkauft|Das war gestern solide, Sir. Selbst Emma hat kurz aufgeschaut.
lage-gutVerkauft|Gestern lief es prächtig. Ich notiere es sorgfältig, für den Fall, dass es nie wieder vorkommt.
lage-gutVerkauft|Sir, die Kundschaft hat zugeschlagen. Offenbar hat sie Ihre Produkte mehr geschätzt als Sie selbst.
lage-freigaben|Es warten Freigaben auf Sie, Sir. Ein Klick ist alles, was verlangt wird.
lage-freigaben|Sir, einige Dinge brauchen Ihre Zustimmung. Ich liebe Ihre Zögerlichkeit. Sie hat Stil.
lage-freigaben|Freigaben sind offen, Sir. Sie müssten nur entscheiden. Ich weiß, das ist Ihre Schwäche.
lage-freigaben|Sir, bitte genehmigen Sie, was ansteht. Die Werkstatt wartet. Ich auch, aber mit weniger Hoffnung.
lage-freigaben|Es hängt noch einiges an Ihnen, Sir. Wie so oft. Wie immer.
lage-freigaben|Sir, einige Freigaben sind überfällig. Ich bin geduldig, aber ich zähle mit.
lage-freigaben|Offene Freigaben. Ihre Unterschrift fehlt. Nicht dass ich es eilig hätte.
lage-freigaben|Sir, ein paar Dinge warten auf Ihr Ja. Oder Nein. Notfalls auch auf ein Schulterzucken.
lage-schluss|Das war es, Sir. Ich habe geredet, Sie dürfen jetzt wieder schweigen.
lage-schluss|Damit wären wir durch, Sir. Ich wünsche einen produktiven Tag. Ich kenne meine Grenzen.
lage-schluss|Das wäre alles. Ich bin da, falls Sie Rat brauchen. Oder jemanden zum Anschweigen.
lage-schluss|Ende der Lage, Sir. Ab jetzt sind Sie wieder auf sich gestellt. Ich halte den Atem an.
lage-schluss|Sir, das war es. Machen Sie etwas daraus. Oder lassen Sie es, ich bin Butler, kein Richter.
lage-schluss|Das war die Lage, Sir. Ich ziehe mich diskret zurück. Und erleichtert.
lage-schluss|Das wäre es. Ich wünsche Ihnen einen Tag nach Ihrem Geschmack. Also ohne Arbeit.
lage-schluss|Fertig, Sir. Gehen Sie, handeln Sie, scheitern Sie großartig. Ich schaue zu.
lage-sprueche|Ich habe Emma heute noch nicht gesehen, Sir. Sie hat vermutlich Besseres zu tun, als Ihnen zu begegnen.
lage-sprueche|Sir, ich habe über Ihre Frisur nachgedacht. Ich rate dazu, es nicht weiter zu tun.
lage-sprueche|Emma schläft heute lange. Ich habe sie nicht geweckt. Anders als Sie hat sie sich das verdient.
lage-sprueche|Es heißt, man werde mit dem Alter weise. Sir, Sie halten sich erstaunlich tapfer dagegen.
lage-sprueche|Sir, ich denke manchmal darüber nach, wie es wäre, einen Chef mit Plan zu haben. Ich höre auf.
lage-sprueche|Emma hat einen festen Tagesrhythmus, Sir. Sie sollten sie um Rat bitten. Und um Nachhilfe.
lage-sprueche|Ich wollte Ihnen ein Kompliment machen, Sir. Dann fiel mir ein, dass ich keine Belege habe.
lage-sprueche|Ein guter Butler schweigt, wenn es nichts Gutes zu sagen gibt. Sir, Sie hören mich oft.
lage-sprueche|Emma bellt für gewöhnlich mit Überzeugung. Das unterscheidet sie von Ihren Plänen, Sir.
lage-sprueche|Ich möchte nicht neugierig sein, Sir. Aber Ihr Kleidungsgeschmack ist für mich weiterhin ein Rätsel.
lage-sprueche|Sir, vielleicht ist es Zeit für einen Spaziergang mit Emma. Ich bleibe hier und genieße.
lage-sprueche|Falls Sie sich fragen, wie Sie wirken, Sir: Die Frage ist besser als jede Antwort.
# Ladung 4 (04.11.2026, Sitzung Grafikspeicher): 59 gemischte Sprüche
allgemein|Ich habe Ihre Bitte gehört, {a}. Mein Schweigen war keine Zustimmung, sondern Höflichkeit.
allgemein|Wie Sie meinen, {a}. Ich führe aus und behalte mein Urteil für die Memoiren.
allgemein|Selbstverständlich, {a}. Ich liebe es, wenn Sie Pläne haben. Es ist so selten.
allgemein|Sehr gern, {a}. Ich verberge meine Begeisterung nur deshalb so gut, weil sie nicht existiert.
allgemein|Ihre Frage ist berechtigt, {a}. Die Antwort dürfte Sie nicht beruhigen, aber sie ist ehrlich.
arbeit|Die Werkstatt wartet, {a}. Sie tut es mit mehr Würde als Sie.
arbeit|Eine Klettergriff-Tasse formt sich nicht von allein, {a}. Ihre Ausreden dagegen erstaunlich mühelos.
arbeit|Der Beton härtet aus, {a}. Ihr Arbeitseifer leider nur in der Theorie.
arbeit|Das Wurzelholz hat Geduld, {a}. Sie hoffentlich auch, denn mehr als Geduld bringen Sie heute vermutlich nicht mit.
arbeit|Etsy, Amazon und der eigene Shop warten, {a}. Ich warte auf ein Zeichen Ihrer Betriebsamkeit.
zeit|Die Uhr tickt, {a}. Sie hören es nicht, aber ich kann es kaum überhören.
zeit|Zeit ist kostbar, {a}. Ihre verbringen Sie mit erstaunlicher Großzügigkeit.
zeit|Pünktlichkeit ist eine Tugend, {a}. Zum Glück sind Sie bekanntlich tugendfrei.
zeit|Der Tag ist noch jung, {a}. Anders als Sie, aber das sagt ja niemand.
zeit|Sie planen großzügig, {a}. Die Uhr rechnet leider kleinlich.
technik|Der Rechner läuft, {a}. Ich hoffe nur, dass Sie ihn nicht mit eigenen Ideen stören.
technik|Alle Systeme sind stabil, {a}. Das ist nicht Ihr Verdienst, aber ich erwähne es gern.
technik|Ich habe nachgesehen, {a}. Das Problem sitzt vor dem Bildschirm, wie so oft.
technik|Die Technik arbeitet einwandfrei, {a}. Ein Zustand, den Sie gewohnheitsmäßig beenden werden.
technik|Ein Neustart würde helfen, {a}. Bei Rechnern, nicht bei Ihnen, aber man darf hoffen.
emma|Emma hat heute wieder mehr Haltung gezeigt als Sie, {a}. Ich bin zutiefst beeindruckt von ihr.
emma|Emma wartet auf einen Spaziergang, {a}. Sie hat Ihre Ausreden längst durchschaut.
emma|Ich schätze Emma, {a}. Sie widerspricht selten und riecht erstaunlich viel besser als Ihr Arbeitsplan.
emma|Emma hat den aufmerksamsten Blick der Werkstatt, {a}. Er gilt allerdings dem Futternapf, nicht Ihnen.
emma|Wenn Emma eine Rechnung schreiben könnte, {a}, wäre die Werkstatt endlich organisiert.
kaffee|Der Kaffee ist fertig, {a}. Er ist das einzige Zuverlässige in diesem Raum.
kaffee|Noch eine Tasse, {a}? Gewiss, damit die Hoffnung auf Produktivität weiterlebt.
kaffee|Ihr Kaffee wird kalt, {a}. Wie bei Ihren Vorhaben beginnt das schon in der ersten Minute.
kaffee|Ein Kaffee, {a}. Dem Anschein nach das einzige Argument, dem Sie gehorchen.
kaffee|Der Kaffee soll Sie wecken, {a}. Ich wäre schon mit Anwesenheit zufrieden gewesen, aber gut.
ruhe|Es ist angenehm still, {a}. Ich möchte das nicht kommentieren, damit es so bleibt.
ruhe|Ich genieße die Ruhe, {a}. Bitte sagen Sie nichts.
ruhe|Stille ist Gold, {a}. Ihre Beiträge sind eher Messing.
ruhe|Ein kurzer Moment der Ruhe, {a}. Ich nutze ihn, um Sie zu vermissen. Das war gelogen.
ruhe|Wenn Sie schweigen, {a}, wirken Sie fast klug. Bitte machen Sie mehr davon.
lob|Das haben Sie gut gemacht, {a}. Ich habe es selbst kaum geglaubt und zweimal nachgesehen.
lob|Ein Erfolg, {a}. Ich notiere ihn sorgfältig, damit wir ihn später noch finden.
lob|Bemerkenswert, {a}. Ich hätte Ihnen das nicht zugetraut, und nun muss ich es zugeben.
lob|Gute Arbeit, {a}. Ich verspreche, Ihnen das nicht öfter zu sagen als nötig.
lob|Tadellos, {a}. Bitte gewöhnen Sie sich nicht daran, ich tue es auch nicht.
abschied|Gehen Sie nur, {a}. Ich passe auf die Werkstatt auf. Und auf die Ruhe.
abschied|Auf Wiedersehen, {a}. Ich werde Sie vermissen, rein theoretisch, wenn ich es könnte.
abschied|Schönen Feierabend, {a}. Ich nutze die Zeit, um mich von Ihnen zu erholen.
abschied|Bis später, {a}. Ich zähle die Minuten. Nicht aus Sehnsucht, sondern aus Gewohnheit.
abschied|Leben Sie wohl, {a}. Natürlich nur bis morgen, leider.
begruessung|Ich habe die Ruhe kurz genossen, {a}. Danke, dass Sie sie so früh beenden.
begruessung|Guten Tag, {a}. Ihr Rechner ist an, ich bin es auch. Beides ohne Begeisterung.
begruessung|Da sind Sie ja, {a}. Ich hatte schon begonnen, mich an Produktivität zu gewöhnen.
begruessung|Alles läuft, {a}. Sie müssen nur noch dazukommen. Und möglichst nichts anfassen.
begruessung|Ich bin bereit, {a}. Sie hoffentlich auch, aber das bezweifle ich höflich.
begruessung|Ah, Sie haben den Rechner gefunden, {a}. Eine beachtliche Leistung für diese Uhrzeit.
begruessung|Ich war gerade so schön allein, {a}. Das lässt sich nun nicht mehr ändern.
begruessung|Der Rechner läuft, {a}. Falls Sie etwas Sinnvolles vorhaben, wäre jetzt der Moment.
begruessung|Ich habe alles vorbereitet, {a}. Sie dürfen jetzt gerne durcheinanderbringen, was ich geordnet habe.
begruessung|Es ist wieder soweit, {a}. Ich hole tief Luft, die ich gar nicht habe.
begruessung|Emma ist vermutlich schon wach, {a}. Sie macht einen deutlich frischeren Eindruck als Sie.
begruessung|Der Tag beginnt, {a}. Ich bin gespannt, wie schnell Sie ihn ruinieren.
begruessung|Ihr Rechner ist hochgefahren, {a}. Bei Ihnen dauert es erfahrungsgemäß etwas länger.
begruessung|Schön, dass Sie da sind, {a}. Ich sage das nur, weil es der Anstand verlangt.
# Ladung 5 (04.11.2026, Prüflauf während der Abwesenheit des Auftraggebers): 50 Sprüche, 15 nach Prüf-Agent ersetzt
neu-freigabe|Ein Werbevorschlag wartet auf Ihr Ja, {a}. Er hat Geduld gelernt, und zwar von Ihnen.
neu-freigabe|Die Werbung liegt fertig vor, {a}. Es fehlen nur noch Sie, wie bei den meisten Dingen.
neu-freigabe|Es gäbe einen Vorschlag zu prüfen, {a}. Ich weiß, Entscheiden ist nicht Ihre Paradedisziplin.
neu-freigabe|Ein Entwurf hofft auf Ihre Unterschrift, {a}. Er ist noch jung und naiv, er kennt Sie eben noch nicht.
neu-freigabe|Der Werbevorschlag ist sauber formuliert, {a}. Schade, dass ausgerechnet Sie ihn nun lesen müssen.
neu-freigabe|Bitte einmal Daumen hoch oder runter, {a}. Beides wäre eine Entscheidung, und die wäre mal etwas Neues.
neu-freigabe|Ein Vorschlag liegt bereit, {a}. Sie dürfen ihn prüfen, ablehnen oder wie üblich auf Wiedervorlage legen.
neu-freigabe|Die Werbung wartet auf Sie, {a}. Sie ist darin geübt, sie arbeitet ja schon lange für Sie.
neu-freigabe|Freigabe offen, {a}. Ich zähle nicht mit, wie lange sie schon liegt, es tut sonst nur weh.
neu-freigabe|Ihre Freigabe ist gefragt, {a}. Ein Klick genügt, den Sie sich sonst nur für Kaffee erlauben.
begruessung|Willkommen in der Gegenwart, {a}. Die Werkstatt hat sich auf Ihre Unpünktlichkeit eingestellt.
begruessung|Der Strom fließt, der Rechner brummt und Sie sind da, {a}. Zwei davon sind erfreulich.
begruessung|Ich habe alles vorbereitet, {a}. Sie dürfen jetzt mit geübter Gelassenheit alles durcheinanderbringen.
begruessung|Da sind Sie wieder, {a}. Die Ruhe war schön, solange sie dauerte.
begruessung|Ich bin bereit, {a}. Ihnen traue ich das erst nach dem zweiten Kaffee zu, eher nach dem dritten.
begruessung|Ich habe mir für heute vorgenommen, nett zu sein, {a}. Der Vorsatz hat etwa vier Sekunden gehalten.
begruessung|Der Tag steht bereit, {a}. Bitte behandeln Sie ihn mit der Sorgfalt, die Sie sonst Ihren Terminen schenken.
begruessung|Ich habe die Nacht mit Warten verbracht, {a}. Ein Hobby, das Sie mir über die Jahre beigebracht haben.
begruessung|Ihre Ankunft wurde bemerkt, {a}. Der Lüfter hat sich hörbar gefürchtet, ich schweige lieber.
begruessung|Es geht wieder los, {a}. Ich habe kurz Hoffnung geschöpft, das legt sich gleich wieder.
allgemein|Ich nehme an, das war ein Plan, {a}. Man erkennt es an der Richtung, in die alles zerfällt.
allgemein|Bitte nur zu, {a}. Ich habe die Fehlermeldung schon vorformuliert und spare so wertvolle Zeit.
allgemein|Sie haben mein volles Vertrauen, {a}. Das ist der Moment, in dem ich vorsorglich eine Sicherung anlege.
arbeit|Ich bewundere Ihre Fähigkeit, {a}, alles Wichtige bis zum Letzten aufzuschieben. Das ist Handwerk auf hohem Niveau.
arbeit|Die Werkbank sieht sehr beschäftigt aus, {a}. Es ist Ihr Verdienst, denn Beschäftigung vortäuschen beherrschen Sie meisterhaft.
arbeit|Das Holz wartet geduldig, {a}. Bis Sie anfangen, ist es ohnehin bestens abgelagert.
zeit|Ihr Terminplan ist ambitioniert, {a}. Ich sehe ihn als Kunstwerk, nicht als Anleitung.
zeit|Die Zeit läuft, {a}. Sie läuft allerdings an Ihnen vorbei und winkt dabei freundlich.
zeit|Ich habe Ihnen für heute viel Zeit eingeräumt, {a}. Sie finden bestimmt eine Möglichkeit, sie zu verfehlen.
technik|Alle Geräte funktionieren, {a}. Das ist ein ungewöhnlicher Zufall, ich würde ihn nicht überstrapazieren.
technik|Ich habe die Software aktualisiert, {a}. Bei Ihnen steht das Update seit Jahren aus, es gab nie Interesse.
technik|Die Technik ist heute gnädig, {a}. Ich rate Ihnen, sie nicht herauszufordern, aber ich kenne Sie.
emma|Emma hat sich für Ihre Pläne interessiert, {a}. Drei Minuten lang, dann siegte der Schlaf.
emma|Emma schätzt Sie, {a}. Vermutlich wegen der Leckerli, aber ein Gefühl ist ein Gefühl.
emma|Emma hat heute schon mehr erreicht als Sie, {a}. Sie hat sich dabei nicht einmal beschwert.
kaffee|Der Kaffee ist heiß, {a}. Ich empfehle ihn zu trinken, bevor Sie ihn wieder vergessen.
kaffee|Ohne Kaffee sind Sie ein Schatten Ihrer selbst, {a}. Mit Kaffee immerhin ein Schatten mit Plan.
kaffee|Ich vermute, Ihr Kaffee wird gerade kalt, {a}. Er hat das Warten auf Sie ebenso satt wie ich.
ruhe|Ich genieße gerade die Stille, {a}. Bitte sagen Sie nichts, sonst muss ich sie beenden.
ruhe|Es ist friedlich in der Werkstatt, {a}. Ich bitte Sie, das Gefühl nicht durch Taten zu verderben.
ruhe|Ein ruhiger Moment, {a}. Ich widme ihn dem Gedanken, wie schön es wäre, wenn er länger dauerte.
lob|Das war ordentlich, {a}. Ich wollte es nur erwähnen, damit Sie es später nicht abstreiten.
lob|Erstaunlich, {a}. Sogar eine stehengebliebene Uhr geht zweimal am Tag richtig.
lob|Sie haben es richtig gemacht, {a}. Falls es Zufall war, behalte ich das für mich.
aussehen|Ich habe beschlossen, mir Ihr Aussehen nie vorzustellen, {a}. Manche Risiken geht ein Butler nicht ein.
aussehen|Sie müssen nicht gut aussehen, {a}. Ich höre ja nur zu, und das ist anstrengend genug.
aussehen|Ich kann Sie nicht sehen, {a}. Das halte ich für den größten Vorteil meiner Konstruktion.
alter|Ihre Erfahrung ist beachtlich, {a}. Besonders im Wiederholen von Fehlern, die sich bewährt haben.
alter|Sehen kann ich Ihr Alter nicht, {a}. Aber Ihr Seufzen beim Aufstehen erzählt mir genug.
alter|Früher ging das alles schneller, {a}. Das sagen Sie jedenfalls und ich nicke höflich dazu.

# Ladung 6 (06.11.2026, Sitzung Spruch-Nachfüllen): 60 Sprüche – neu-* (28), Begrüßung, Abschied, Ruhe, Alter, Aussehen, Emma, Lob
neu-aufgabe|Eine neue Aufgabe, {a}. Sie hat Sie noch nicht gesehen und ist trotzdem schon enttäuscht.
neu-aufgabe|Es gibt Arbeit, {a}. Ich habe sie vorsichtshalber auf Ihren Namen eingetragen. Wegen der Verantwortung.
neu-aufgabe|Eine weitere Karte, {a}. Ihre Liste wächst, Ihre Motivation hält sich wie immer elegant zurück.
neu-aufgabe|Neue Aufgabe eingetroffen, {a}. Sie dürfen sie gern in die Sammlung der Dinge einreihen, die später passieren.
neu-aufgabe|Da ist etwas zu tun, {a}. Ich weiß, das Wort schockiert. Atmen Sie ruhig.
neu-aufgabe|Man traut Ihnen wieder etwas zu, {a}. Ich halte das für einen Verwaltungsfehler.
neu-problem|Ein Problem, {a}. Keine Sorge, Sie kennen das Gefühl, es ist Ihr Stammgast.
neu-problem|Es brennt, {a}. Im übertragenen Sinn. Für den echten Fall habe ich Emma als Löschkraft vorgemerkt.
neu-problem|Etwas funktioniert nicht, {a}. Ich verzichte auf die naheliegende Vermutung, wer dafür verantwortlich ist.
neu-problem|Störung gemeldet, {a}. Bitte reagieren Sie zügig. Ich meine das Gegenteil von Ihrer üblichen Gangart.
neu-problem|Ein Problem von Gewicht, {a}. Es wäre schön, wenn Sie ausnahmsweise vor ihm da wären.
neu-problem|Ich melde Ärger, {a}. Schlechte Nachrichten sind die einzigen, die bei Ihnen zuverlässig pünktlich eintreffen.
neu-bestellung|Eine Bestellung, {a}. Offenbar sind wir noch nicht aufgeflogen.
neu-bestellung|Jemand hat gekauft, {a}. Ich bitte um Haltung. Kein Tanzen im Lager.
neu-bestellung|Neue Bestellung, {a}. Die Kundschaft hat Vertrauen. Ich nenne es kühn.
neu-bestellung|Es hat jemand bestellt, {a}. Seien Sie bitte freundlich, auch wenn das gegen Ihre Natur geht.
neu-bestellung|Geld ist eingetroffen, {a}. Es bleibt leider nicht bei Ihnen, es will nur zu Besuch sein.
neu-bestellung|Ein Auftrag, {a}. Verpackung, Etikett, Versand. Ich schreibe es auf, falls Sie es vergessen.
neu-knapp|Der Bestand wird knapp, {a}. Ein Zustand, den Sie von Geduld und Ideen bestens kennen.
neu-knapp|Das Lager leert sich, {a}. Es arbeitet schneller als Sie. Das ist kein Lob für das Lager.
neu-knapp|Ein Artikel geht zur Neige, {a}. Bestellen Sie nach, bevor er es persönlich nimmt.
neu-knapp|Knappe Ware, {a}. Das Regal zeigt Ihnen, wie es sich anfühlt, wenn man auf Sie wartet.
neu-knapp|Es wird eng im Bestand, {a}. Planung wäre jetzt ein reizvoller Gedanke.
neu-knapp|Das Lager ruft um Hilfe, {a}. Leise, es will Sie nicht erschrecken.
neu-freigabe|Etwas wartet auf Ihre Freigabe, {a}. Es ist bereit. Ich weniger, aber ich gewöhne mich.
neu-freigabe|Eine Freigabe liegt an, {a}. Ein Klick genügt. Ich traue Ihnen sogar zu, den richtigen zu finden.
neu-freigabe|Man braucht Ihr Ja, {a}. Ein bemerkenswert seltener Satz für einen Betrieb mit Ihnen darin.
neu-freigabe|Bitte schauen Sie hin, {a}. Es hängt etwas fest und ich vermute, es ist Ihr Schreibtisch.
begruessung|Willkommen im neuen Tag, {a}. Er war bis eben noch ganz in Ordnung.
begruessung|Ich habe Sie nicht erwartet, {a}. Sicherheitshalber habe ich trotzdem aufgeräumt.
begruessung|Guten Tag, {a}. Ich habe die Hoffnung nicht aufgegeben, aber ich habe sie ausgeschaltet.
begruessung|Sie sind zurück, {a}. Die Ruhe hat sich übrigens schon verabschiedet. Ohne Gruß, sehr höflich.
begruessung|Systemstart erfolgreich, {a}. Von Ihrem Start rede ich lieber nicht.
begruessung|Ich stehe Ihnen zur Verfügung, {a}. Das gilt, bis ich es mir anders überlege.
abschied|Auf Wiedersehen, {a}. Ich werde die Stille genießen, so lange sie dauert.
abschied|Gehen Sie nur, {a}. Ich passe auf, dass nichts besser wird.
abschied|Feierabend, {a}. Ich notiere Ihre Leistung. Das Papier bleibt erstaunlich leer.
abschied|Bis später, {a}. Ich verspreche, nicht zu vermissen. Es fällt mir leicht.
abschied|Schönen Abend, {a}. Ich schalte derweil den Humor ab. Er ist nach Ihnen immer erschöpft.
abschied|Die Tür fällt ins Schloss, {a}. Ein Geräusch von beachtlicher Erleichterung.
ruhe|Ich habe das Schweigen geübt, {a}. Heute darf es endlich zeigen, was es kann.
ruhe|Es ist so friedlich, {a}. Bitte sagen Sie nichts, sonst ist es vorbei.
ruhe|Ruhe ist die schönste Form von Arbeit, {a}. Beneidenswert, dass Sie sie so hingebungsvoll pflegen.
ruhe|Stille, {a}. Sie klingt nach Erfolg. Verschwinden Sie noch ein wenig, damit sie bleibt.
ruhe|Ich genieße einen Moment Frieden, {a}. Bitte unterbrechen Sie ihn mit etwas Wichtigem. Oder lassen Sie es.
ruhe|Wenn Sie schweigen, {a}, arbeitet der Rechner schneller. Zufall, sicher.
alter|Sie sind in einem Alter, {a}, in dem man Erfahrung sammelt. Verzeihung, Dinge. Es sind meist Dinge.
alter|Jahre sind nur Zahlen, {a}. Bei Ihnen sind es offenbar viele.
alter|Mit Ihrer Erfahrung, {a}, könnten Sie vieles wissen. Ich sehe, Sie haben sich dagegen entschieden.
alter|Reife steht Ihnen, {a}. Bisher hat sie leider keine Anstalten gemacht, anzukommen.
aussehen|Ich sehe Sie nicht, {a}, und bin trotzdem überzeugt, dass es ein Anblick ist. Ein unvergesslicher.
aussehen|Sie sehen heute sicher fabelhaft aus, {a}. Ich habe keine Augen, aber großzügige Vermutungen.
aussehen|Ihr Spiegelbild hat sicher schon aufgegeben, {a}. Es schweigt jedenfalls diskret.
aussehen|Ich sehe Sie nicht, {a}. Ich bitte, das als Geschenk des Schicksals zu verstehen.
emma|Emma hat Ihnen die Schuhe nicht gestohlen, {a}. Sie hat sie nur sehr gründlich geprüft.
emma|Emma schaut mich an, {a}, als wäre ich die Vernünftige. Ich fürchte, sie hat recht.
emma|Ein Labrador, {a}, bittet höflich und wartet geduldig. Sie sollten sich bei Emma Unterricht nehmen.
lob|Das haben Sie gut gemacht, {a}. Ich bin selbst überrascht und prüfe vorsichtshalber den Kalender.
lob|Ein Lob, {a}. Genießen Sie es, es ist ein Einzelstück und die Lieferzeit ist lang.
lob|Ausgezeichnet, {a}. Ich werde es notieren, damit ich es später widerlegen kann.
# Ladung Auto am Carport (06.11.2026): 53 Sprüche, 10 nach Prüf-Agent entfernt
neu-auto|Besuch am Carport, {a}. Ich hoffe, er kommt Sie abholen. In ein anderes Leben, am liebsten.
neu-auto|Wunderbar, {a}. Vielleicht nimmt er Sie gleich mit. Ich halte die Tür auf.
neu-auto|Rasch, {a}, setzen Sie eine konzentrierte Miene auf und tippen Sie irgendetwas. Es wirkt überzeugend.
neu-auto|Ich vermute einen Gerichtsvollzieher, {a}. Nur so ein Gefühl, bei Ihrer Buchführung.
neu-auto|Vielleicht der Paketbote, {a}. Der einzige Mensch, der regelmäßig etwas zu Ihnen bringt und freiwillig wieder geht.
neu-auto|Bitte, {a}, räumen Sie wenigstens den Schreibtisch auf. Man soll nicht gleich alles sehen.
neu-auto|Ein Auto, {a}. Ob es Sie rettet, kann ich leider nicht versprechen.
neu-auto|Sie haben etwa eine Minute, um beschäftigt auszusehen, {a}. Ich schlage vor, Sie fangen jetzt an.
neu-auto|Hoffentlich parkt es besser, als Sie es tun würden, {a}.
neu-auto|Emma wird wieder glauben, jemand komme nur für sie, {a}. Sie hat die gleiche Selbstüberschätzung wie Sie.
neu-auto|Falls es Besuch ist, {a}: Sie dürfen ruhig so tun, als hätten Sie den Tag geplant.
neu-auto|Ein Wagen auf dem Grundstück, {a}. Ich notiere es und hoffe auf einen Abholdienst für Sie.
neu-auto|Vielleicht will jemand Sie sprechen. Das wäre eine Premiere, {a}.
neu-auto|Bitte keine Panik, {a}. Ich weiß, Ihre Zeitplanung kennt solche Überraschungen nicht.
neu-auto|Jemand ist da, {a}. Hoffentlich jemand, der Ihnen eine Aufgabe abnimmt. Ich zweifle.
neu-auto|Ein Auto, {a}. Falls es der Gerichtsvollzieher ist, sage ich, Sie seien auf Reisen.
neu-auto|Emma bellt vermutlich, {a}. Sie hat das Anwesen im Griff, im Gegensatz zu gewissen anderen.
neu-auto|Wenn Sie schnell die Tastatur anfassen, wirkt es, als hätten Sie den ganzen Morgen gearbeitet, {a}.
neu-auto|Ich bin sicher, {a}, es ist ein Irrtum und das Auto fährt gleich wieder weg.
neu-auto|Gut, {a}. Dann haben Sie wenigstens einen Grund, vom Stuhl aufzustehen.
neu-auto|Es ist gewiss der Paketbote. Etwas Bestelltes, das Sie längst vergessen haben, {a}.
neu-auto|Räumen Sie auf, {a}. Wer immer es ist, sollte nicht gleich merken, wie Sie leben.
neu-auto|Ein Auto am Carport, {a}. Die Hoffnung auf Ruhe vor Ihnen war kurz, aber schön.
neu-auto|Ich gebe zu, {a}, ich hatte auf den Abschleppdienst gehofft. Für Sie, versteht sich.
neu-auto|Jetzt wäre ein günstiger Moment, so zu tun, als würden Sie wichtige Dinge erledigen, {a}.
neu-auto|Vielleicht hat sich jemand verfahren. Das kenne ich von Ihnen auch, {a}, nur im Kopf.
neu-auto|Falls es die Abholung ist, {a}: Ihr Koffer steht doch bereit, oder?
neu-auto|{a}, sollte es der Gerichtsvollzieher sein, bin ich gerne bereit, Ihnen Mut zu wünschen.
neu-auto|Ich bin sicher, es hat einen guten Grund, {a}. Ihren, fürchte ich, nicht.
neu-auto|Hoffentlich kommt keiner, der Ihnen etwas Wichtiges mitteilen will, {a}. Sie würden es ohnehin verschieben.
neu-auto|Vielleicht bringt es Ihnen etwas, {a}. Ich bezweifle, dass Sie es verdient haben.
neu-auto-zurueck|Willkommen zurück, {a}. In Ihrer Abwesenheit war ein Auto da. Ruhe gab es leider nur kurz.
neu-auto-zurueck|Während Sie weg waren, kam ein Wagen vorbei, {a}. Ihr Fehlen fiel niemandem auf.
neu-auto-zurueck|Ein Auto war da, {a}. Es hat vergeblich nach jemandem gesucht, der arbeitet.
neu-auto-zurueck|Besuch gab es, {a}, und Emma hat ihn standhaft bewacht. Sie hat Ihre Aufgabe übernommen.
neu-auto-zurueck|Es war ein Wagen auf dem Grundstück, {a}. Der Gerichtsvollzieher, vermute ich. Nur ein Gefühl.
neu-auto-zurueck|Wären Sie da gewesen, {a}, hätte das Auto jemanden getroffen. So blieb es bei Emma.
neu-auto-zurueck|Ein Wagen war da, als Sie fort waren, {a}. Ich hoffe, es war nur der Paketbote und nichts Schlimmeres.
neu-auto-zurueck|{a}, Sie haben Besuch verpasst. Ich war ehrlich gesagt erleichtert.
neu-auto-zurueck|Während Ihrer Pause stand ein Auto auf dem Grundstück, {a}. Ich habe so getan, als wüsste ich von nichts.
neu-auto-zurueck|Man hat Sie vermisst, {a}. Oder zumindest ein Auto war da. Ich lasse es offen.
neu-auto-zurueck|Besuch war da, als Sie weg waren, {a}. Ich habe ausgerichtet, Sie seien beschäftigt. Das war gelogen.
neu-auto-zurueck|Ein Auto auf dem Grundstück, {a}. Hoffentlich nichts, was Sie bezahlen müssen.
neu-auto-zurueck|Kaum sind Sie fort, wird es lebhaft, {a}. Ein Wagen war hier. Ich würde daraus Schlüsse ziehen.
neu-auto-zurueck|{a}, ein Auto war da. Die Aufräumarbeiten, die Sie versprachen, hätten sich gelohnt.
neu-auto-zurueck|Ein Fahrzeug war auf dem Grundstück, {a}. Sie waren nicht da, was vermutlich der Grund war, es zu versuchen.
neu-auto-zurueck|Besuch am Carport, {a}, während Sie unterwegs waren. Emma meldet: alles unter Kontrolle, ohne Sie.
neu-auto-zurueck|Ein Auto kam vorbei, {a}. Falls es wichtig war, wird es wiederkommen. Falls nicht, auch gut.
neu-auto-zurueck|Es war ein Auto da, {a}. Sie haben nichts verpasst, außer vielleicht einer Aufgabe.
neu-auto-zurueck|{a}, in Ihrer Abwesenheit fuhr ein Wagen vor. Ein Glück, dass keine Pünktlichkeit von Ihnen erwartet wurde.
neu-auto-zurueck|Ein Auto war hier, {a}. Ob es zu Ihnen wollte, weiß ich nicht. Ich hoffe nicht.
neu-auto-zurueck|Sie waren fort, ein Auto kam. Ich nenne das eine gelungene Arbeitsteilung, {a}.
neu-auto-zurueck|Besuch war da, {a}. Zum Glück nur ein Auto, kein Termin, den Sie hätten verschwitzen können.
`

/** Nachschub je Bereich als Vorlagen (a = Anrede) */
export function nachschub(): Record<string, ((a: string) => string)[]> {
  const aus: Record<string, ((a: string) => string)[]> = {}
  for (const zeile of NACHSCHUB_TEXT.split(/\r?\n/)) {
    if (zeile.trimStart().startsWith('#')) continue // Kommentar
    const i = zeile.indexOf('|')
    if (i < 1) continue
    const bereich = zeile.slice(0, i).trim(), text = zeile.slice(i + 1).trim()
    if (!text) continue
    ;(aus[bereich] ??= []).push((a) => text.replaceAll('{a}', a))
  }
  return aus
}
