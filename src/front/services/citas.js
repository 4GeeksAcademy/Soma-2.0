// Cliente HTTP del módulo de Agenda — ver src/api/citas.py para el contrato real.

import { request, authHeaders } from "./api";

// GET /api/citas -> [cita] (el backend ya filtra a "las mías" si el rol es especialista)
export const listarCitas = (token) =>
	request("/api/citas", { headers: authHeaders(token) });

// POST /api/citas -> cita | 409 si especialista o espacio ya están ocupados en ese horario
export const crearCita = (token, { especialistaId, espacioId, fechaHora, pacienteId, servicioId }) =>
	request("/api/citas", {
		method: "POST",
		headers: authHeaders(token),
		body: JSON.stringify({
			especialista_id: especialistaId,
			espacio_id: espacioId,
			fecha_hora: fechaHora,
			paciente_id: pacienteId || null,
			servicio_id: servicioId || null
		})
	});

// PUT /api/citas/:id -> cita | 409 si el nuevo horario choca
// Solo manda los campos presentes -- una especialista reagendando su propia cita
// solo envia fechaHora; el backend conserva especialista_id/espacio_id si no llegan.
export const editarCita = (token, id, { especialistaId, espacioId, fechaHora }) => {
	const body = {};
	if (fechaHora !== undefined) body.fecha_hora = fechaHora;
	if (especialistaId !== undefined) body.especialista_id = especialistaId;
	if (espacioId !== undefined) body.espacio_id = espacioId;

	return request(`/api/citas/${id}`, {
		method: "PUT",
		headers: authHeaders(token),
		body: JSON.stringify(body)
	});
};

// POST /api/citas/:id/cancelar -> cita (sin penalización, ver docs/decisiones.md)
export const cancelarCita = (token, id) =>
	request(`/api/citas/${id}/cancelar`, {
		method: "POST",
		headers: authHeaders(token)
	});
