import { connection } from "next/server";
import { responderError } from "@/lib/cfdi/http";
import { proveedor } from "@/lib/cfdi/proveedor";

/* GET /api/cfdi/estado → qué proveedor está activo. Sirve para probar que la API responde. */
export async function GET() {
  await connection(); // que no se prerenderice en el build: el proveedor depende del .env de ejecución
  try {
    const p = proveedor();
    return Response.json({
      ok: true,
      proveedor: p.nombre,
      descripcion: p.descripcion,
      simulado: p.nombre === "mock",
      validezFiscal: false,
    });
  } catch (e) {
    return responderError(e);
  }
}
