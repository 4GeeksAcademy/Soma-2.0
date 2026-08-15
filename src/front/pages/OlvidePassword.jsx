import { useState } from "react";
import { Link } from "react-router-dom";
import { solicitarResetPassword } from "../services/auth";
import { AuthLayout, inputClass, labelClass, ErrorBanner } from "../components/AuthLayout";

export const OlvidePassword = () => {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);
	const [enviado, setEnviado] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setCargando(true);
		try {
			await solicitarResetPassword(email);
			setEnviado(true);
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
	};

	if (enviado) {
		return (
			<AuthLayout>
				<h1 className="mb-1 text-2xl">Revisa tu correo</h1>
				<p className="mb-7 text-[14.5px] text-ink-soft">
					Si <span className="font-semibold text-ink">{email}</span> tiene una cuenta en Soma, te enviamos un link para
					restablecer tu contraseña. Es válido por 1 hora.
				</p>
				<Link
					to="/login"
					className="block w-full rounded-full bg-ink py-3.5 text-center text-[15px] font-bold text-paper hover:bg-cafe"
				>
					Volver a iniciar sesión
				</Link>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout>
			<form onSubmit={handleSubmit}>
				<h1 className="mb-1 text-2xl">¿Olvidaste tu contraseña?</h1>
				<p className="mb-7 text-[14.5px] text-ink-soft">
					Escribe tu correo y te mandamos un link para crear una nueva.
				</p>

				<ErrorBanner mensaje={error} />

				<div className="mb-6">
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

				<button
					type="submit"
					disabled={cargando}
					className="w-full rounded-full bg-ink py-3.5 text-[15px] font-bold text-paper hover:bg-cafe disabled:opacity-60"
				>
					{cargando ? "Enviando…" : "Enviar link"}
				</button>
			</form>
		</AuthLayout>
	);
};
