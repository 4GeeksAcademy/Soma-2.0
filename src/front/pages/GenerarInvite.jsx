import React, { useState } from "react";

export const GenerarInvite = () => {
	const [email, setEmail] = useState("");
	const [tipo, setTipo] = useState("cliente");
	const [pacienteId, setPacienteId] = useState("");
	const [linkGenerado, setLinkGenerado] = useState("");
	const [mensaje, setMensaje] = useState("");

	const handleGenerar = async (e) => {
		e.preventDefault();
		setMensaje("");
		setLinkGenerado("");

		try {
			const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invites`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email,
					tipo: tipo,
					paciente_id: pacienteId ? parseInt(pacienteId) : null
				})
			});

			const data = await response.json();

			if (response.ok) {
				const urlCompleta = `${window.location.origin}/invite/${data.token}`;
				setLinkGenerado(urlCompleta);
				setMensaje("¡Boleto dorado creado con éxito! 🎫✨");
			} else {
				setMensaje(data.msg || "Error al crear el boleto");
			}
		} catch (error) {
			setMensaje("Error de conexión con el servidor");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-orange-50">
			<div className="p-8 bg-white rounded-3xl shadow-lg w-96 text-center">
				<h1 className="text-2xl font-bold text-orange-900 mb-6">Generar Invite</h1>

				{/* Cuadrito de mensajes de éxito o error */}
				{mensaje && (
					<div
						className={`p-3 mb-4 rounded-xl text-sm ${linkGenerado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
					>
						{mensaje}
					</div>
				)}

				<form onSubmit={handleGenerar} className="space-y-4 text-left">
					<div>
						<label className="block text-xs font-bold text-gray-500 mb-1">CORREO DEL USUARIO</label>
						<input
							type="email"
							className="w-full p-3 rounded-xl bg-blue-50 focus:outline-none"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div>
						<label className="block text-xs font-bold text-gray-500 mb-1">TIPO DE USUARIO</label>
						<select
							className="w-full p-3 rounded-xl bg-blue-50 focus:outline-none"
							value={tipo}
							onChange={(e) => setTipo(e.target.value)}
						>
							<option value="cliente">Paciente / Cliente</option>
							<option value="asistente">Asistente</option>
							<option value="especialista">Especialista</option>
						</select>
					</div>

					<div>
						<label className="block text-xs font-bold text-gray-500 mb-1">ID DEL PACIENTE (Opcional)</label>
						<input
							type="number"
							className="w-full p-3 rounded-xl bg-blue-50 focus:outline-none"
							value={pacienteId}
							onChange={(e) => setPacienteId(e.target.value)}
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-[#2D2825] text-white p-3 rounded-full font-bold mt-4 hover:bg-black transition-colors"
					>
						Generar Link Mágico
					</button>
				</form>

				{/* Si se generó el link, lo mostramos aquí abajo para que el Admin lo copie */}
				{linkGenerado && (
					<div className="mt-6 p-4 bg-gray-100 rounded-xl">
						<p className="text-xs text-gray-500 mb-2 font-bold">Copia este link y envíaselo al paciente:</p>
						<textarea
							readOnly
							className="w-full text-sm bg-transparent border-none focus:outline-none resize-none text-blue-600"
							value={linkGenerado}
							rows="3"
						/>
					</div>
				)}
			</div>
		</div>
	);
};
