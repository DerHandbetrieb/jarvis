// Nachschub an Sprüchen (04.11.2026, Wunsch Auftraggeber: „wenn ich mit dir arbeite, parallel ein paar Sprüche klopfen
// und reinbauen“). Je Zeile „bereich|Spruch“, {a} = Anrede. Bereiche: die des Fundus (allgemein, arbeit, zeit, technik,
// emma, kaffee, ruhe, lob, abschied, aussehen, alter), „begruessung“ (Rechnerstart, nach „Willkommen zurück, Sir.“) und
// „neu-bestellung“, „neu-aufgabe“, „neu-problem“, „neu-knapp“, „neu-freigabe“, „neu-zurueck“ (Seitenhiebe nach Neuigkeiten).
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
