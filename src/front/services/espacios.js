// Cliente HTTP del módulo de Espacios de Trabajo — ver src/api/espacios.py para el contrato real.
// Todo el blueprint es admin-only (ver docs/decisiones.md, matriz de permisos).

import { request, authHeaders } from "./api";

// GET /api/espacios -> [espacio]
export const listarEspacios = (token) =>
	request("/api/espacios", { headers: authHeaders(token) });

// POST /api/espacios -> espacio
export const crearEspacio = (token, { nombre, tipo }) =>
	request("/api/espacios", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify({ nombre, tipo })
	});

// PUT /api/espacios/:id -> espacio
export const actualizarEspacio = (token, id, { nombre, tipo }) =>
	request(`/api/espacios/${id}`, {
		method: "PUT",
		headers: authHeaders(token),
		body: JSON.stringify({ nombre, tipo })
	});

// DELETE /api/espacios/:id -> 204 sin body
export const eliminarEspacio = (token, id) =>
	request(`/api/espacios/${id}`, {
		method: "DELETE",
		headers: authHeaders(token)
	});
