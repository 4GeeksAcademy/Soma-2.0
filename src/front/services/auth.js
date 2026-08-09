// Cliente HTTP del módulo de auth — ver src/api/auth.py para el contrato real.

const backendUrl = () => {
	const url = import.meta.env.VITE_BACKEND_URL;
	if (!url) throw new Error("VITE_BACKEND_URL no está definida en .env");
	return url;
};

const request = async (path, options) => {
	let response;
	try {
		response = await fetch(`${backendUrl()}${path}`, options);
	} catch {
		throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
	}
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.error || "Ocurrió un error inesperado.");
	}
	return data;
};

// POST /api/auth/login -> { access_token, usuario }
export const login = (email, password) =>
	request("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password })
	});

// POST /api/auth/cambiar-password (autenticado) -> { mensaje }
// Usado en el primer login cuando usuario.debe_cambiar_password === true (#23).
export const cambiarPassword = (token, passwordActual, passwordNueva) =>
	request("/api/auth/cambiar-password", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva })
	});
