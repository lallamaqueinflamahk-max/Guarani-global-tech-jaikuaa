# Contrato entre Jaikuaa y el motor HFST/LEXC (versión 1.0)

Fecha: 19 de octubre de 2026. Validación en código: `src/lib/morph/motor-contract.ts` (con pruebas en
`suite-contrato-motor.test.ts`).

Este contrato dice qué le pregunta Jaikuaa al motor de Alan y qué responde el motor. Mantiene el sobre
que ya usa la API de Alan (`success`, `message`, `data`, `timestamp`) y fija lo que va dentro de `data`.
Sale de la auditoría del motor V3 (18-10-2026), que recomendó dejar de elegir `analysis[0]` y devolver
todas las lecturas con su procedencia.

## Reglas

1. **El motor solo analiza.** No genera, traduce, completa ni corrige guaraní. El modo «generar» queda
   fuera de esta versión.
2. **Todas las lecturas, en el orden del transductor.** Si hay varias y no hay evidencia para elegir,
   `estado` = `sin_resolver` y `seleccion` = `null`.
3. **Nada de pesos inventados.** `peso` es `null` si HFST no da un peso comparable. `rango` es solo el
   orden de entrega, no una probabilidad ni un «grado de certeza».
4. **Auditable.** Cada lectura trae `analisis_crudo`: la salida del transductor tal cual.
5. **Con fuente.** Si el motor sabe qué páginas de la Gramática ALG 2020 respaldan la regla usada, las
   pone en `paginas`.
6. **Pendiente de validación.** Ninguna lectura es «la correcta» hasta que la valide un docente.

## Pedido

```
POST /v1/analizar
Authorization: Bearer <clave del servicio>
Content-Type: application/json

{ "texto": "ndojapói", "max_lecturas": 20 }
```

- `texto`: una palabra o un texto de hasta 2.000 palabras.
- `max_lecturas` (opcional): tope de lecturas por palabra; por defecto, todas.
- La clave vive solo en el servidor de Jaikuaa (secretos `ALAN_MOTOR_URL` y `ALAN_MOTOR_TOKEN`); nunca
  en el navegador.
- Jaikuaa espera la respuesta como máximo 4 segundos; si no llega, sigue con el Laboratorio solo.

## Respuesta

Ejemplo con una palabra impresa en la Gramática ALG 2020 (pág. 24, «ndojapói»). La forma de
`analisis_crudo` es solo ilustrativa: la define el transductor de Alan.

```json
{
  "success": true,
  "message": null,
  "timestamp": "2026-10-19T12:00:00Z",
  "data": {
    "version_contrato": "1.0",
    "motor": { "nombre": "jaikuaa-hfst", "version": "3.12", "transductor": "2026-10-19 a1b2c3" },
    "tokens": [
      {
        "superficie": "ndojapói",
        "normalizada": "ndojapói",
        "estado": "una_lectura",
        "seleccion": null,
        "metodo": null,
        "lecturas": [
          {
            "raiz": "japo",
            "lema": "japo",
            "categoria": "verbo",
            "persona": "3",
            "negacion": true,
            "prefijos": [
              { "forma": "nd", "rasgo": "negacion" },
              { "forma": "o", "rasgo": "persona", "valor": "3" }
            ],
            "sufijos": [{ "forma": "i", "rasgo": "negacion" }],
            "analisis_crudo": "<salida de hfst-lookup>",
            "rango": 1,
            "peso": null,
            "paginas": [25, 115],
            "procedencia": "hfst"
          }
        ]
      }
    ]
  }
}
```

### Campos

| Campo | Tipo | Obligatorio | Qué es |
| --- | --- | --- | --- |
| `version_contrato` | texto | sí | «1.0». Jaikuaa rechaza otra versión mayor. |
| `motor.nombre`, `motor.version` | texto | sí | Para saber qué motor respondió. |
| `motor.transductor` | texto o null | no | Fecha o hash del `.hfst` compilado. |
| `tokens[].superficie` | texto | sí | La palabra tal como vino en el texto. |
| `tokens[].normalizada` | texto | no | La palabra después de normalizar (tildes, puso). |
| `tokens[].lecturas` | lista | sí | Vacía si no hay análisis. |
| `tokens[].estado` | texto | sí | `sin_analisis`, `una_lectura`, `sin_resolver` o `resuelta`. |
| `tokens[].seleccion` | número o null | no | Índice elegido; solo con `estado` = `resuelta`. |
| `tokens[].metodo` | texto o null | no | Qué regla eligió la lectura, si `resuelta`. |
| `lecturas[].raiz` | texto | sí | Raíz sin prefijos ni sufijos. |
| `lecturas[].lema` | texto o null | no | Forma de diccionario, si difiere de la raíz. |
| `lecturas[].categoria` | texto o null | no | verbo, sustantivo, adjetivo, adverbio, pronombre, posposición, otra. |
| `lecturas[].persona` | texto o null | no | `1sg`, `2sg`, `3`, `1pl_incl`, `1pl_excl`, `2pl`. |
| `lecturas[].negacion` | sí/no | no | Si la lectura es negativa. |
| `lecturas[].prefijos`, `sufijos` | lista | no | Cada pieza: `forma`, `rasgo` y `valor` opcional. |
| `lecturas[].analisis_crudo` | texto | sí | Salida del transductor, tal cual. |
| `lecturas[].rango` | número | no | Orden de entrega (1 = primera). |
| `lecturas[].peso` | número o null | no | Solo si HFST lo da. |
| `lecturas[].paginas` | lista de números | no | Páginas de la Gramática ALG 2020. |
| `lecturas[].procedencia` | texto | no | Por defecto `hfst`. |

### Errores

`{ "success": false, "message": "<qué pasó>", "data": null, "timestamp": "…" }`. Jaikuaa muestra el
mensaje en el Laboratorio y sigue con sus propias lecturas.

## Cómo lo usa Jaikuaa

- El Laboratorio muestra las lecturas del motor HFST al lado de las suyas y marca cuáles coinciden
  (misma persona, misma raíz sin acento agudo y mismos sufijos), con el mismo criterio que
  `docs/motor/comparar-motores.ts`.
- Si el servicio no está configurado, no responde o responde con otra forma, el Laboratorio lo dice y
  sigue funcionando.
- Las diferencias entre los dos motores van a la cola de los docentes; ninguna se resuelve sola.

## Lo que queda para la versión 1.1

- Modo `lematizar` (solo lemas).
- Pedido por lotes del examen común (371 palabras) en una sola llamada.
