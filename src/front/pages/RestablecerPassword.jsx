import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmarResetPassword } from "../services/auth";
import { AuthLayout, inputClass, labelClass, ErrorBanner } from "../components/AuthLayout";

// Ruta exacta esperada por el link del correo: /restablecer-password?token=... (ver
// _enviar_email_reset en src/api/auth.py -- no renombrar sin actualizar ese template).
export const RestablecerPassword = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const navigate = useNavigate();

	const [passwordNueva, setPasswordNueva] = useState("");
	const [passwordConfirmar, setPasswordConfirmar] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		if (passwordNueva !== passwordConfirmar) {
			setError("Las contraseñas no coinciden.");
			return;
		}
		setCargando(true);
		try {
			await confirmarResetPassword(token, passwordNueva);
			navigate("/login", {
				replace: true,
				state: { mensaje: "Tu contraseña se actualizó. Inicia sesión con la nueva." }
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
	};

	if (!token) {
		return (
			<AuthLayout>
				<h1 className="mb-1 text-2xl">Link inválido</h1>
				<p className="mb-7 text-[14.5px] text-ink-soft">
					Este link de restablecimiento no es válido o ya venció. Solicita uno nuevo.
				</p>
				<Link
					to="/olvide-password"
					className="block w-full rounded-full bg-ink py-3.5 text-center text-[15px] font-bold text-paper hover:bg-cafe"
				>
					Solicitar link nuevo
				</Link>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout>
			<form onSubmit={handleSubmit}>
				<h1 className="mb-1 text-2xl">Crea una contraseña nueva</h1>
				<p className="mb-7 text-[14.5px] text-ink-soft">Tiene que ser distinta a la anterior.</p>

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
					{cargando ? "Guardando…" : "Guardar contraseña"}
				</button>
			</form>
		</AuthLayout>
	);
};
