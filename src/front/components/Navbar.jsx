import { Link, NavLink, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const linkClass = ({ isActive }) =>
	`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
		isActive ? "bg-ink text-paper" : "text-ink-soft hover:bg-nude"
	}`;

export const Navbar = () => {
	const { store, dispatch } = useGlobalReducer();
	const navigate = useNavigate();

	const handleLogout = () => {
		dispatch({ type: "logout" });
		navigate("/login", { replace: true });
	};

	return (
		<nav className="border-b border-ink/[0.08] bg-paper">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
				<Link to="/app/agenda" className="font-display text-lg font-semibold text-ink">
					Soma
				</Link>

				<div className="flex items-center gap-1">
					<NavLink to="/app/agenda" className={linkClass}>
						Agenda
					</NavLink>
					{store.usuario?.rol === "admin" ? (
						<NavLink to="/app/espacios" className={linkClass}>
							Espacios
						</NavLink>
					) : null}
				</div>

				<div className="flex items-center gap-3">
					<span className="text-[13.5px] text-ink-soft">
						{store.usuario?.nombre}
						{store.usuario?.rol ? ` · ${store.usuario.rol}` : ""}
					</span>
					<button
						onClick={handleLogout}
						className="rounded-full border-[1.5px] border-beige px-4 py-1.5 text-[13.5px] font-semibold text-ink-soft hover:border-cafe hover:text-cafe"
					>
						Cerrar sesión
					</button>
				</div>
			</div>
		</nav>
	);
};
