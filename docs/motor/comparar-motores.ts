/**
 * Compara el motor de Alan con el del Laboratorio sobre el examen común.
 *
 * Uso: completar el campo `motor_alan` de cada palabra en docs/motor/examen-comun.json
 * (formato en el mismo archivo) y correr:
 *   npx tsx docs/motor/comparar-motores.ts [ruta-del-examen]
 *
 * Escribe docs/motor/comparacion.csv y muestra un resumen. Una palabra «coincide» si alguna
 * lectura de Alan tiene la misma persona, la misma raíz (sin acento agudo) y los mismos sufijos
 * que alguna lectura verbal del Laboratorio. Las que no coinciden van a la cola de los docentes.
 */
import { readFileSync, writeFileSync } from "node:fs";

type Lectura = { persona?: string; raiz: string; sufijos?: string[] };
type Palabra = {
  conjunto: string;
  palabra: string;
  laboratorio: { verbo: Lectura[]; sustantivo: { raiz: string; sufijos: string[] }[] };
  motor_alan: { lecturas: (Lectura & { confianza?: number })[] } | null;
};

const ruta = process.argv[2] ?? "docs/motor/examen-comun.json";
const examen = JSON.parse(readFileSync(ruta, "utf8")) as { palabras: Palabra[] };
const sinAgudo = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC").toLowerCase();
const clave = (l: Lectura) => `${l.persona ?? ""}|${sinAgudo(l.raiz)}|${(l.sufijos ?? []).map(sinAgudo).join("+")}`;

type Resultado = "coinciden" | "solo_laboratorio" | "solo_alan" | "ninguno" | "distintas" | "sin_respuesta";
const filas: string[] = ["conjunto,palabra,resultado,laboratorio,motor_alan"];
const cuenta: Record<Resultado, number> = { coinciden: 0, solo_laboratorio: 0, solo_alan: 0, ninguno: 0, distintas: 0, sin_respuesta: 0 };

for (const p of examen.palabras) {
  const lab = p.laboratorio.verbo.map(clave);
  let r: Resultado;
  let alan: string[] = [];
  if (p.motor_alan === null) r = "sin_respuesta";
  else {
    alan = p.motor_alan.lecturas.map(clave);
    if (lab.length === 0 && alan.length === 0) r = "ninguno";
    else if (alan.length === 0) r = "solo_laboratorio";
    else if (lab.length === 0) r = "solo_alan";
    else r = alan.some((a) => lab.includes(a)) ? "coinciden" : "distintas";
  }
  cuenta[r]++;
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  filas.push([p.conjunto, q(p.palabra), r, q(lab.join(" ; ")), q(alan.join(" ; "))].join(","));
}

writeFileSync("docs/motor/comparacion.csv", filas.join("\n") + "\n");
const total = examen.palabras.length;
console.log(`Palabras: ${total}`);
for (const [k, v] of Object.entries(cuenta)) console.log(`${k.padEnd(18)} ${String(v).padStart(4)}  ${((100 * v) / total).toFixed(1)} %`);
console.log("Detalle en docs/motor/comparacion.csv. Las «distintas», «solo_alan» y «solo_laboratorio» van a revisión de docentes.");
