const backendUrl = () => {
	const url = import.meta.env.VITE_BACKEND_URL || "";
	return url;
};

export const obtenerResumenDashboard = async (token, params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.rango) queryParams.append("rango", params.rango);
	if (params.desde) queryParams.append("desde", params.desde);
	if (params.hasta) queryParams.append("hasta", params.hasta);

	const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

	const response = await fetch(`${backendUrl()}/api/dashboard/resumen${queryString}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`
		}
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error || "Error al cargar los datos del Dashboard");
	}
	return data;
};

// GET /api/dashboard/mis-citas -> comisiones (citas completadas) y citas programadas
// del especialista autenticado, filtradas por el mismo rango que el resumen de Admin.
export const obtenerMisCitasEspecialista = async (token, params = {}) => {
	const queryParams = new URLSearchParams();
	if (params.rango) queryParams.append("rango", params.rango);
	if (params.desde) queryParams.append("desde", params.desde);
	if (params.hasta) queryParams.append("hasta", params.hasta);

	const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

	const response = await fetch(`${backendUrl()}/api/dashboard/mis-citas${queryString}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`
		}
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error || "Error al cargar tus citas y comisiones");
	}
	return data;
};
