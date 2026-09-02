import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const RedimirInvite = () => {
	const { token } = useParams();
	const navigate = useNavigate();

	// Aquii guardo lo que el paciente va escribiendo en los inputs
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");

	// Estados para manejar los avisos de exito o error
	const [mensaje, setMensaje] = useState("");
	const [error, setError] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			// Hago la petición al backend para canjear el token
			const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invites/${token}/redimir`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: password, email: email })
			});

			const data = await response.json();

			if (response.ok) {
				setError(false);
				setMensaje("¡Contraseña creada con éxito! Llevándote al login...");

				// Hago una pequena pausa de 2 seg antes de mandarlo al login
				setTimeout(() => navigate("/login"), 2000);
			} else {
				// Si el token esta vencido o pasa algo raro
				setError(true);
				setMensaje(data.msg || "Ocurrió un error.");
			}
		} catch (error) {
			setError(true);
			setMensaje("Error de conexión con el servidor.");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-paper">
			<div className="p-8 bg-white rounded-xl shadow-sm border border-beige w-96">
				<h1 className="text-2xl font-display font-bold text-cafe mb-6 text-center">Crea tu contraseña</h1>

				{/* Cuadro de aviso (se pinta verde o rojo dependiendo del estado) */}
				{mensaje && (
					<div
						className={`mb-6 p-4 rounded-lg text-sm font-data text-center ${error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
					>
						{mensaje}
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<label className="text-cafe font-data font-semibold text-sm tracking-wider uppercase">
							Confirma tu Correo
						</label>
						<input
							type="email"
							placeholder="tucorreo@ejemplo.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="p-3 border border-beige rounded-lg focus:ring-2 focus:ring-cafe/20 focus:border-cafe font-data"
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-cafe font-data font-semibold text-sm tracking-wider uppercase">
							Nueva Contraseña
						</label>
						<input
							type="password"
							placeholder="********"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="p-3 border border-beige rounded-lg focus:ring-2 focus:ring-cafe/20 focus:border-cafe font-data"
							required
						/>
					</div>

					<button
						type="submit"
						className="mt-4 bg-ink text-paper p-3 rounded-full hover:bg-cafe transition font-data font-semibold"
					>
						Guardar y Entrar
					</button>
				</form>
			</div>
		</div>
	);
};
