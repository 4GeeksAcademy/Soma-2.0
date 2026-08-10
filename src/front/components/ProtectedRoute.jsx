import { Navigate, Outlet, useLocation } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

// Guard de /app/* -- si no hay sesión, redirige a /login recordando a dónde
// se quería llegar (Login.jsx la usa para volver ahí después de autenticar).
export const ProtectedRoute = () => {
	const { store } = useGlobalReducer();
	const location = useLocation();

	if (!store.token) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
};
