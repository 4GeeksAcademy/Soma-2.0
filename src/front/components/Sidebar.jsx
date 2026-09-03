import { Link, NavLink, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const linkClass = ({ isActive }) =>
	`block rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${
		isActive ? "bg-ink text-paper" : "text-ink-soft hover:bg-nude"
	}`;

const grupoClass = "mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint first:mt-0";

export const Sidebar = () => {
	const { store, dispatch } = useGlobalReducer();
	const navigate = useNavigate();
	const rol = store.usuario?.rol;
	const esStaffOperativo = ["admin", "asistente"].includes(rol);
	const esAdmin = rol === "admin";

	const handleLogout = () => {
		dispatch({ type: "logout" });
		navigate("/login", { replace: true });
	};

	return (
		<aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink/[0.08] bg-paper">
			<Link to="/app/agenda" className="px-5 py-5 font-display text-lg font-semibold text-ink">
				Soma
			</Link>

			<nav className="flex-1 overflow-y-auto px-3 pb-4">
				<p className={grupoClass}>Operación</p>
				<NavLink to="/app/agenda" className={linkClass}>
					Agenda
				</NavLink>
				<NavLink to="/app/pacientes" className={linkClass}>
					Pacientes
				</NavLink>
				{/* Ventas: matching @rol_requerido("admin", "asistente") en api/ventas.py -- antes se mostraba a todos */}
				{esStaffOperativo ? (
					<NavLink to="/app/ventas" className={linkClass}>
						Ventas
					</NavLink>
				) : null}

				{esStaffOperativo ? (
					<>
						<p className={grupoClass}>Catálogo</p>
						<NavLink to="/app/nuevo-servicio" className={linkClass}>
							Servicios
						</NavLink>
						<NavLink to="/app/paquetes" className={linkClass}>
							Paquetes
						</NavLink>
					</>
				) : null}

				{esStaffOperativo || esAdmin ? (
					<>
						<p className={grupoClass}>Clínica</p>
						{esStaffOperativo ? (
							<NavLink to="/app/invitaciones" className={linkClass}>
								Invitaciones
							</NavLink>
						) : null}
						{esAdmin ? (
							<>
								<NavLink to="/app/espacios" className={linkClass}>
									Espacios
								</NavLink>
								<NavLink to="/app/perfil" className={linkClass}>
									Perfil
								</NavLink>
							</>
						) : null}
					</>
				) : null}
			</nav>

			<div className="border-t border-ink/[0.08] px-4 py-4">
				<p className="mb-2 truncate text-[13px] text-ink-soft">
					{store.usuario?.nombre}
					{rol ? ` · ${rol}` : ""}
				</p>
				<button
					onClick={handleLogout}
					className="w-full rounded-full border-[1.5px] border-beige px-4 py-1.5 text-[13.5px] font-semibold text-ink-soft hover:border-cafe hover:text-cafe"
				>
					Cerrar sesión
				</button>
			</div>
		</aside>
	);
};
