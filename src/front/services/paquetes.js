// Cliente HTTP del módulo de Paquetes (Catálogo) — ver src/api/paquetes.py para el contrato real.

import { request, authHeaders } from "./api";

// GET /api/paquetes -> [{...paquete, servicios: [{servicio_id, servicio_nombre, num_sesiones}]}]
export const listarPaquetes = (token) => request("/api/paquetes", { headers: authHeaders(token) });

// GET /api/paquetes/paciente/:pacienteId -> paquetes ya comprados (activos) por ese paciente,
// para venderle una sesión desde Ventas -- no es el catálogo.
export const listarPaquetesDePaciente = (token, pacienteId) =>
	request(`/api/paquetes/paciente/${pacienteId}`, { headers: authHeaders(token) });

// POST /api/paquetes -> {paquete, servicios}
export const crearPaquete = (token, { nombre, precioTotal, servicios }) =>
	request("/api/paquetes", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify({ nombre, precio_total: precioTotal, servicios })
	});
