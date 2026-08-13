import { Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

 export const AppIndexRedirect = () => {
        const { store } = useGlobalReducer();
        const rol = store.usuario?.rol;

        if (rol === "admin") {
            return <Navigate to="/app/dashboard" replace />;
        }

        return <Navigate to="/app/agenda" replace />;
    };

    