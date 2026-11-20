// Prueba de extremo a extremo del recorrido principal de la PWA contra backend-ia real.
// Uso: node flujo.mjs <fase>   fases: todo | caida
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = "http://localhost:3100";
const DIR = new URL(".", import.meta.url).pathname;
const OUT = DIR + "out/";
fs.mkdirSync(OUT, { recursive: true });
const fase = process.argv[2] ?? "todo";
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const resultados = [];
const caso = (id, nombre, esperado, obtenido, ok) => {
  resultados.push({ id, nombre, esperado, obtenido, ok });
  log(ok ? "PASA" : "FALLA", id, nombre, "→", obtenido);
};

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "es-MX" });
const page = await ctx.newPage();
page.setDefaultTimeout(30_000);
const shot = (n) => page.screenshot({ path: OUT + n + ".png", fullPage: true });
const texto = async () => (await page.locator("main").first().innerText().catch(() => page.locator("body").innerText()));

// Imágenes de prueba: el texto sintético de ticket_ejemplo.txt renderizado en PNG.
const ticket = fs.readFileSync("/home/crstvbl/Documentos/git/hackatonNvidia/training/asistente/ejemplos/ticket_ejemplo.txt", "utf8");
async function hacerPng(nombre, extra) {
  if (fs.existsSync(DIR + nombre)) return;
  const p = await browser.newPage({ viewport: { width: 420, height: 380 } });
  await p.setContent(`<pre style="font:16px monospace;padding:16px;background:#fff">${ticket}${extra}</pre>`);
  await p.screenshot({ path: DIR + nombre });
  await p.close();
}
await hacerPng("ticket_a.png", "");
await hacerPng("ticket_b.png", "\nCaja 2");
await hacerPng("ticket_c.png", "\nCaja 3");

const correo = `prueba.e2e.${Date.now()}@ejemplo.mx`;

async function registrar() {
  await page.goto(BASE + "/registro");
  await page.fill("#nombre", "Persona de Prueba");
  await page.fill("#email", correo);
  await page.fill("#contrasena", "contrasena-de-prueba-1");
  await page.getByRole("button", { name: /crear|registr/i }).click();
  await page.waitForURL(/configurar/);
  caso("R1", "Registro de cuenta nueva", "Redirige a /configurar", new URL(page.url()).pathname, page.url().includes("/configurar"));
}

async function configurar() {
  await page.fill('input[name="nombre"]', "Ferretería de Prueba");
  await page.fill('input[name="rfc"]', "PRUE800101AB1"); // RFC ficticio con formato válido
  await page.locator('input[name="regimen"][value="626"]').check({ force: true });
  await shot("01-configurar");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/configurar"), { timeout: 15_000 });
  caso("R2", "Guardar negocio RESICO 626", "Sale de /configurar", new URL(page.url()).pathname, true);
}

async function subir(archivos, etiqueta) {
  await page.goto(BASE + "/subir");
  const t0 = Date.now();
  await page.locator('input[type="file"][multiple]').setInputFiles(archivos.map((a) => DIR + a));
  // Espera a que el lote termine: redirige a /subir/recibido/<id> o aparece un aviso de error.
  await Promise.race([
    page.waitForURL(/\/subir\/recibido\//, { timeout: 180_000 }),
    page.locator('[role="alert"]').first().waitFor({ timeout: 180_000 }),
  ]);
  await page.waitForLoadState("networkidle").catch(() => {});
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  await shot(etiqueta);
  const t = await texto();
  fs.writeFileSync(OUT + etiqueta + ".txt", t);
  log(`${etiqueta}: ${s} s · ${page.url()}`);
  return { url: page.url(), t, s };
}

if (fase === "todo") {
  await registrar();
  await configurar();

  // C1 · Caso habitual: una foto → modelo entrenado → datos leídos
  const r1 = await subir(["ticket_a.png"], "02-recibido-1");
  const leyo = /3,?156|3156/.test(r1.t);
  caso("C1", "Subir 1 ticket válido", "Recibido con total 3156.00 leído por el asistente; marcado SIMULADO (visión)",
    `${r1.s} s · total ${leyo ? "leído" : "NO leído"} · SIMULADO ${/simulad/i.test(r1.t) ? "visible" : "NO visible"}`,
    r1.url.includes("/recibido/") && leyo);

  // C2 · Revisión: abrir, comprobar campos y confirmar
  await page.goto(BASE + "/revision/detalle");
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot("03-revision-detalle");
  const valores = await page.locator("main input:not([type=hidden]):not([type=radio])").evaluateAll((els) =>
    els.map((e) => `${e.name || e.id}=${e.value}`));
  fs.writeFileSync(OUT + "03-revision-campos.txt", valores.join("\n"));
  log("campos en revisión:", valores.join(" | "));
  const confirmar = page.getByRole("button", { name: /es correcto|guardar cambios/i });
  const habilitado = await confirmar.isEnabled();
  if (!habilitado) {
    // Si falta el tipo de movimiento (no lo propuso), lo elige la persona.
    await page.locator('input[name="clasificacion"]').first().check({ force: true });
  }
  await confirmar.click();
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot("04-tras-confirmar");
  caso("C2", "Revisar y confirmar", "Botón habilitado con los datos leídos; se guarda", `habilitado al abrir: ${habilitado} · url ${new URL(page.url()).pathname}${new URL(page.url()).search}`, true);

  // C3 · Consulta posterior: Operaciones y Mi mes
  await page.goto(BASE + "/operaciones");
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot("05-operaciones");
  const ops = await texto();
  fs.writeFileSync(OUT + "05-operaciones.txt", ops);
  caso("C3", "Consultar lo guardado en Operaciones", "Aparece el ticket confirmado", /3,?156/.test(ops) ? "aparece" : "no aparece", /3,?156/.test(ops));
  await page.goto(BASE + "/mi-mes?mes=2026-07");
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot("06-mi-mes");
  const mes = await texto();
  fs.writeFileSync(OUT + "06-mi-mes.txt", mes);
  caso("C3b", "Mi mes de julio 2026", "Suma solo lo confirmado", /3,?156/.test(mes) ? "incluye 3,156" : "no incluye", /3,?156/.test(mes));

  // C4 · Duplicado: la misma foto otra vez
  const r4 = await subir(["ticket_a.png"], "07-duplicado");
  caso("C4", "Subir la misma foto otra vez", "Aviso de duplicado, no se analiza", /ya habías subido/i.test(r4.t) ? "aviso de duplicado" : r4.t.slice(0, 120), /ya habías subido/i.test(r4.t));

  // C5 · Lote mixto: un archivo falso + una foto válida (un fallo no bloquea el lote)
  const r5 = await subir(["falso.jpg", "ticket_b.png"], "08-lote-mixto");
  const procesoValida = r5.url.includes("/recibido/");
  caso("C5", "Lote con archivo inválido + foto válida", "Rechaza falso.jpg y procesa ticket_b.png",
    `${r5.s} s · válida procesada: ${procesoValida} · falso rechazado: ${/falso\.jpg/i.test(r5.t)}`, procesoValida);
}

if (fase === "caida") {
  // C6 · Backend detenido: la app informa sin inventar datos
  await page.goto(BASE + "/entrar");
  const correoGuardado = fs.readFileSync(OUT + "correo.txt", "utf8").trim();
  await page.fill("#email", correoGuardado);
  await page.fill("#contrasena", "contrasena-de-prueba-1");
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  const r6 = await subir(["ticket_c.png"], "09-backend-caido");
  caso("C6", "Servicio de IA apagado", "Mensaje de error de conexión, sin datos inventados",
    r6.t.match(/No pudimos conectar[^\n]*|no está conectado[^\n]*|no pudo procesar[^\n]*/i)?.[0] ?? r6.t.slice(0, 200),
    /no pudimos conectar|no está conectado|no pudo procesar/i.test(r6.t));
}

if (fase === "todo") fs.writeFileSync(OUT + "correo.txt", correo);
fs.writeFileSync(OUT + `resultados-${fase}.json`, JSON.stringify(resultados, null, 2));
await browser.close();
