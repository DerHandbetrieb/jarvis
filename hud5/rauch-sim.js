// Rauch als echte Strömungs-Simulation auf der Grafikkarte (Intro, 05.11.2026 – Rückmeldung Auftraggeber: Nebel soll
// aussehen, als würde er durch Druck hereingeblasen, nicht wie ein hereingeschobenes Bild). Verfahren „Stable Fluids“
// (Jos Stam 1999): Geschwindigkeit und Rauchdichte werden mitgeführt, Druck sorgt für Wirbel und Ausweichen,
// Wirbelverstärkung (vorticity confinement) für die typischen Kringel. Eigene Umsetzung in WebGL 2.
// Fläche: ganze Szene 5760×1080, Rechengitter grob (Geschwindigkeit) bzw. feiner (Rauch).

const VS = `#version 300 es
in vec2 p; out vec2 uv; out vec2 l; out vec2 r; out vec2 o; out vec2 u; uniform vec2 px;
void main(){ uv = p * 0.5 + 0.5; l = uv - vec2(px.x, 0.); r = uv + vec2(px.x, 0.); o = uv + vec2(0., px.y); u = uv - vec2(0., px.y); gl_Position = vec4(p, 0., 1.); }`
const KOPF = '#version 300 es\nprecision highp float; in vec2 uv; in vec2 l; in vec2 r; in vec2 o; in vec2 u; out vec4 f;\n' +
  'float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
  'float vn(vec2 p){ vec2 i = floor(p), q = fract(p); q = q * q * (3. - 2. * q); return mix(mix(hs(i), hs(i + vec2(1, 0)), q.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), q.x), q.y); }\n' +
  'float fbm(vec2 p){ float s = 0., a = 0.5; for (int k = 0; k < 5; k++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }\n'
const FS = {
  // Werte entlang der Strömung mitnehmen (semi-Lagrange), mit Abklingen
  mitnehmen: KOPF + `uniform sampler2D v; uniform sampler2D q; uniform vec2 vpx; uniform float dt; uniform float abkl;
    void main(){ vec2 h = uv - dt * texture(v, uv).xy * vpx; f = clamp(texture(q, h) / (1. + abkl * dt), -400., 400.); }`,
  // Stoß: Gauß-Fleck mit Wert (Geschwindigkeit oder Rauch) hinzufügen, elliptisch (Seitenverhältnis)
  stoss: KOPF + `uniform sampler2D q; uniform vec2 pkt; uniform vec3 wert; uniform float rad; uniform float seite;
    void main(){ vec2 d = uv - pkt; d.x *= seite; float g = exp(-dot(d, d) / rad); vec3 w = wert;
      if (wert.y == 0. && wert.z == 0.) w.x *= 0.35 + 1.3 * fbm(uv * vec2(seite, 1.) * 60.); /* Rauch klumpig ausstoßen */
      f = vec4(texture(q, uv).xyz + g * w, 1.); }`,
  wirbel: KOPF + `uniform sampler2D v; void main(){ f = vec4(0.5 * (texture(v, r).y - texture(v, l).y - texture(v, o).x + texture(v, u).x), 0., 0., 1.); }`,
  wirbelKraft: KOPF + `uniform sampler2D v; uniform sampler2D w; uniform float staerke; uniform float dt;
    void main(){ float L = texture(w, l).x, R = texture(w, r).x, O = texture(w, o).x, U = texture(w, u).x, C = texture(w, uv).x;
      vec2 k = 0.5 * vec2(abs(O) - abs(U), abs(R) - abs(L)); k /= length(k) + 1e-4; k *= staerke * C; k.y *= -1.;
      f = vec4(texture(v, uv).xy + k * dt, 0., 1.); }`,
  divergenz: KOPF + `uniform sampler2D v; void main(){ float L = texture(v, l).x, R = texture(v, r).x, O = texture(v, o).y, U = texture(v, u).y;
      if (l.x < 0.) L = -texture(v, uv).x; if (r.x > 1.) R = -texture(v, uv).x; if (o.y > 1.) O = -texture(v, uv).y; if (u.y < 0.) U = -texture(v, uv).y;
      f = vec4(0.5 * (R - L + O - U), 0., 0., 1.); }`,
  druck: KOPF + `uniform sampler2D pr; uniform sampler2D dv;
    void main(){ f = vec4((texture(pr, l).x + texture(pr, r).x + texture(pr, o).x + texture(pr, u).x - texture(dv, uv).x) * 0.25, 0., 0., 1.); }`,
  abziehen: KOPF + `uniform sampler2D pr; uniform sampler2D v;
    void main(){ f = vec4(texture(v, uv).xy - vec2(texture(pr, r).x - texture(pr, l).x, texture(pr, o).x - texture(pr, u).x), 0., 1.); }`,
  leeren: KOPF + `uniform sampler2D q; uniform float faktor; void main(){ f = faktor * texture(q, uv); }`,
  // Ausgabe: Dichte → Rauchfarbe mit Licht von der Reaktormitte, Alpha weich (vormultipliziert)
  zeigen: KOPF + `uniform sampler2D q; uniform vec2 licht; uniform float hell; uniform float seite; uniform vec2 dpx; uniform float zeit;
    float dd(vec2 p){ return max(0., texture(q, p).x); }
    void main(){
      float d = 0.4 * dd(uv) + 0.15 * (dd(uv + vec2(dpx.x, 0.)) + dd(uv - vec2(dpx.x, 0.)) + dd(uv + vec2(0., dpx.y)) + dd(uv - vec2(0., dpx.y)));
      vec2 p = uv * vec2(seite, 1.);
      float fein = fbm(p * 7. + vec2(zeit * 0.06, -zeit * 0.03)) * fbm(p * 19. - vec2(zeit * 0.11, zeit * 0.05)); /* Fasern und Bäusche */
      d *= 0.5 + 2.6 * fein;
      float gy = dd(uv + vec2(0., dpx.y * 3.)) - dd(uv - vec2(0., dpx.y * 3.)), gx = dd(uv + vec2(dpx.x * 3., 0.)) - dd(uv - vec2(dpx.x * 3., 0.));
      vec2 zumLicht = normalize((licht - uv) * vec2(seite, 1.) + 1e-4);
      float schatten = clamp(0.85 + 0.9 * (gy * 0.6 + dot(vec2(gx, gy), zumLicht) * 0.5), 0.25, 1.25); /* Oberseite und Lichtseite heller */
      float a = 1. - exp(-d * 1.7);
      vec2 dl = (uv - licht) * vec2(seite, 1.); float glanz = exp(-dot(dl, dl) * 5.);
      vec3 farbe = mix(vec3(0.40, 0.50, 0.56), vec3(0.74, 0.92, 1.0), clamp(0.25 + glanz * 0.7, 0., 1.)) * schatten;
      f = vec4(farbe * a * hell, a * hell); }`,
}

/** Simulation anlegen. breite/hoehe = Szenenfläche; gitter = Zellen in der Höhe für die Geschwindigkeit */
export function erstelleRauch(breite = 5760, hoehe = 1080, { gitter = 150, rauchGitter = 540 } = {}) {
  const c = document.createElement('canvas'); c.width = Math.round((rauchGitter * breite) / hoehe); c.height = rauchGitter
  const gl = c.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null
  gl.getExtension('OES_texture_float_linear')
  const seite = breite / hoehe
  const prog = (fs) => {
    const p = gl.createProgram()
    for (const [typ, q] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(typ); gl.shaderSource(s, q); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(p, s) }
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p)
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name) }
    return { p, u }
  }
  const P = Object.fromEntries(Object.entries(FS).map(([k, q]) => [k, prog(q)]))
  const puffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, puffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const ziel = (b, h, format, intern) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, intern, b, h, 0, format, gl.HALF_FLOAT, null)
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
    gl.viewport(0, 0, b, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    return { t, fb, b, h }
  }
  const doppel = (b, h, format, intern) => { let a = ziel(b, h, format, intern), z = ziel(b, h, format, intern); return { get lesen() { return a }, get schreiben() { return z }, tauschen() { [a, z] = [z, a] } } }
  const vb = Math.round(gitter * seite), vh = gitter, db = c.width, dh = c.height
  const V = doppel(vb, vh, gl.RG, gl.RG16F), D = doppel(db, dh, gl.RED, gl.R16F), PR = doppel(vb, vh, gl.RED, gl.R16F)
  const DIV = ziel(vb, vh, gl.RED, gl.R16F), W = ziel(vb, vh, gl.RED, gl.R16F)
  const lauf = (pr, z, uni, px) => {
    gl.useProgram(pr.p); gl.uniform2f(pr.u.px, 1 / px[0], 1 / px[1])
    let einheit = 0
    for (const [k, v] of Object.entries(uni)) {
      const ort = pr.u[k]; if (ort == null) continue
      if (v && v.t) { gl.activeTexture(gl.TEXTURE0 + einheit); gl.bindTexture(gl.TEXTURE_2D, v.t); gl.uniform1i(ort, einheit++) }
      else if (Array.isArray(v)) (v.length === 2 ? gl.uniform2f : gl.uniform3f).call(gl, ort, ...v)
      else gl.uniform1f(ort, v)
    }
    if (z) { gl.bindFramebuffer(gl.FRAMEBUFFER, z.fb); gl.viewport(0, 0, z.b, z.h) } else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, c.width, c.height) }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  const sim = {
    leinwand: c, wirbelStaerke: 18, rauchAbkl: 0.55, tempoAbkl: 1.0,
    /** Stoß an Szenenpunkt (x, y) mit Geschwindigkeit (vx, vy) in Szenen-Pixeln/s und Rauchmenge; rad in Szenen-Pixeln */
    stoss(x, y, vx, vy, menge, rad = 120) {
      const pkt = [x / breite, 1 - y / hoehe], r2 = (rad / hoehe) ** 2
      lauf(P.stoss, V.schreiben, { q: V.lesen, pkt, wert: [vx / hoehe * vh, -vy / hoehe * vh, 0], rad: r2, seite }, [vb, vh]); V.tauschen()
      if (menge) { lauf(P.stoss, D.schreiben, { q: D.lesen, pkt, wert: [menge, 0, 0], rad: r2 * 0.7, seite }, [db, dh]); D.tauschen() }
    },
    schritt(dt) {
      dt = Math.min(dt, 1 / 30)
      lauf(P.wirbel, W, { v: V.lesen }, [vb, vh])
      lauf(P.wirbelKraft, V.schreiben, { v: V.lesen, w: W, staerke: sim.wirbelStaerke, dt }, [vb, vh]); V.tauschen()
      lauf(P.divergenz, DIV, { v: V.lesen }, [vb, vh])
      lauf(P.leeren, PR.schreiben, { q: PR.lesen, faktor: 0.8 }, [vb, vh]); PR.tauschen()
      for (let i = 0; i < 32; i++) { lauf(P.druck, PR.schreiben, { pr: PR.lesen, dv: DIV }, [vb, vh]); PR.tauschen() }
      lauf(P.abziehen, V.schreiben, { pr: PR.lesen, v: V.lesen }, [vb, vh]); V.tauschen()
      lauf(P.mitnehmen, V.schreiben, { v: V.lesen, q: V.lesen, vpx: [1, 1], dt, abkl: sim.tempoAbkl }, [vb, vh]); V.tauschen()
      lauf(P.mitnehmen, D.schreiben, { v: V.lesen, q: D.lesen, vpx: [1, 1], dt, abkl: sim.rauchAbkl }, [db, dh]); D.tauschen()
    },
    /** Rauch in die Leinwand der Simulation zeichnen (danach mit drawImage in die Szene) */
    zeigen(lichtX = 0.5, lichtY = 0.46, hell = 1, zeit = 0) {
      gl.clearColor(0, 0, 0, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clear(gl.COLOR_BUFFER_BIT)
      lauf(P.zeigen, null, { q: D.lesen, licht: [lichtX, 1 - lichtY], hell, seite, dpx: [1.5 / db, 1.5 / dh], zeit }, [db, dh])
      return c
    },
    leeren() { for (const z of [V.lesen, V.schreiben, D.lesen, D.schreiben, PR.lesen, PR.schreiben]) { gl.bindFramebuffer(gl.FRAMEBUFFER, z.fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT) } },
  }
  return sim
}
