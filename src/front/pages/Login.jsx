import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { login as loginRequest, cambiarPassword as cambiarPasswordRequest } from "../services/auth";

const inputClass =
	"w-full rounded-sm border-[1.5px] border-beige bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-cafe focus:ring-4 focus:ring-cafe/[0.14]";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

const ErrorBanner = ({ mensaje }) =>
	mensaje ? (
		<div className="mb-5 rounded-sm bg-error-bg px-4 py-3 text-[13.5px] text-error-text">{mensaje}</div>
	) : null;

ErrorBanner.propTypes = {
	mensaje: PropTypes.string
};

export const Login = () => {
	const { dispatch } = useGlobalReducer();
	const navigate = useNavigate();
	const location = useLocation();
	const destino = location.state?.from?.pathname || "/app";

	// "login" -> formulario normal | "cambiar-password" -> forzado por debe_cambiar_password (#23)
	const [paso, setPaso] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordNueva, setPasswordNueva] = useState("");
	const [passwordConfirmar, setPasswordConfirmar] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);
	const [sesionTemporal, setSesionTemporal] = useState(null);

	const handleLogin = async (event) => {
		event.preventDefault();
		setError("");
		setCargando(true);
		try {
			const { access_token, usuario } = await loginRequest(email, password);
			if (usuario.debe_cambiar_password) {
				setSesionTemporal({ token: access_token, usuario });
				setPaso("cambiar-password");
			} else {
				dispatch({ type: "set_auth", payload: { token: access_token, usuario } });
				navigate(destino, { replace: true });
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
	};

	const handleCambiarPassword = async (event) => {
		event.preventDefault();
		setError("");
		if (passwordNueva !== passwordConfirmar) {
			setError("Las contraseñas no coinciden.");
			return;
		}
		setCargando(true);
		try {
			await cambiarPasswordRequest(sesionTemporal.token, password, passwordNueva);
			const usuarioActualizado = { ...sesionTemporal.usuario, debe_cambiar_password: false };
			dispatch({ type: "set_auth", payload: { token: sesionTemporal.token, usuario: usuarioActualizado } });
			navigate(destino, { replace: true });
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-paper-alt px-6">
			<div className="w-full max-w-[400px] rounded-lg border border-ink/[0.08] bg-paper p-10 shadow-card">
				<Link to="/" className="mb-8 block text-center font-display text-xl font-semibold text-ink">
					Soma
				</Link>

				{paso === "login" ? (
					<form onSubmit={handleLogin}>
						<h1 className="mb-1 text-2xl">Inicia sesión</h1>
						<p className="mb-7 text-[14.5px] text-ink-soft">Agenda, expedientes e inventario, en un solo lugar.</p>

						<ErrorBanner mensaje={error} />

						<div className="mb-4">
							<label className={labelClass} htmlFor="email">
								Correo
							</label>
							<input
								id="email"
								type="email"
								autoComplete="email"
								required
								className={inputClass}
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</div>

						<div className="mb-6">
							<label className={labelClass} htmlFor="password">
								Contraseña
							</label>
							<input
								id="password"
								type="password"
								autoComplete="current-password"
								required
								className={inputClass}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>

						<button
							type="submit"
							disabled={cargando}
							className="w-full rounded-full bg-ink py-3.5 text-[15px] font-bold text-paper hover:bg-cafe disabled:opacity-60"
						>
							{cargando ? "Ingresando…" : "Iniciar sesión"}
						</button>
					</form>
				) : (
					<form onSubmit={handleCambiarPassword}>
						<h1 className="mb-1 text-2xl">Actualiza tu contraseña</h1>
						<p className="mb-7 text-[14.5px] text-ink-soft">
							Es tu primer ingreso — define una contraseña nueva antes de continuar.
						</p>

						<ErrorBanner mensaje={error} />

						<div className="mb-4">
							<label className={labelClass} htmlFor="password-nueva">
								Contraseña nueva
							</label>
							<input
								id="password-nueva"
								type="password"
								autoComplete="new-password"
								required
								minLength={8}
								className={inputClass}
								value={passwordNueva}
								onChange={(event) => setPasswordNueva(event.target.value)}
							/>
						</div>

						<div className="mb-6">
							<label className={labelClass} htmlFor="password-confirmar">
								Confirma la contraseña nueva
							</label>
							<input
								id="password-confirmar"
								type="password"
								autoComplete="new-password"
								required
								minLength={8}
								className={inputClass}
								value={passwordConfirmar}
								onChange={(event) => setPasswordConfirmar(event.target.value)}
							/>
						</div>

						<button
							type="submit"
							disabled={cargando}
							className="w-full rounded-full bg-ink py-3.5 text-[15px] font-bold text-paper hover:bg-cafe disabled:opacity-60"
						>
							{cargando ? "Guardando…" : "Guardar y continuar"}
						</button>
					</form>
				)}

				<Link to="/" className="mt-6 block text-center text-[13px] text-ink-faint hover:text-cafe">
					← Volver al inicio
				</Link>
			</div>
		</div>
	);
};
