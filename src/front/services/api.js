// Cliente HTTP compartido -- todos los servicios (auth, espacios, citas...) lo usan
// en vez de repetir fetch/backendUrl en cada archivo.

export const backendUrl = () => {
	const url = import.meta.env.VITE_BACKEND_URL;
	if (!url) throw new Error("VITE_BACKEND_URL no está definida en .env");
	return url;
};

export const request = async (path, options) => {
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

// Headers estándar para endpoints autenticados (todo lo que no sea login/reset-password).
export const authHeaders = (token) => ({
	"Content-Type": "application/json",
	Authorization: `Bearer ${token}`
});
