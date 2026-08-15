// Cliente HTTP del módulo de Usuarios — ver src/api/usuarios.py para el contrato real.

import { request, authHeaders } from "./api";

// GET /api/usuarios[?rol=admin|asistente|especialista] -> [usuario]
export const listarUsuarios = (token, rol) =>
	request(`/api/usuarios${rol ? `?rol=${rol}` : ""}`, { headers: authHeaders(token) });
