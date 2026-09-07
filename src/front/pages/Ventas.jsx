import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { obtenerPacientes } from "../services/pacientes";
import { listarServicios } from "../services/servicios";
import { listarPaquetesDePaciente } from "../services/paquetes";
import { listarVentas, registrarVenta } from "../services/ventas";

const formatMoney = (amount) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2
	}).format(amount || 0);
};

export const Ventas = () => {
	const { store } = useGlobalReducer();
	const token = store.token;

	// Datos del catálogo
	const [pacientes, setPacientes] = useState([]);
	const [servicios, setServicios] = useState([]);
	const [ventas, setVentas] = useState([]);

	// Estados del formulario
	const [pacienteId, setPacienteId] = useState("");
	const [paquetesPaciente, setPaquetesPaciente] = useState([]);
	const [cargandoPaquetesPaciente, setCargandoPaquetesPaciente] = useState(false);

	// Item que se está armando para agregar a la cuenta
	const [tipoItemNuevo, setTipoItemNuevo] = useState("servicio"); // "servicio" | "paquete"
	const [servicioIdNuevo, setServicioIdNuevo] = useState("");
	const [paqueteIdNuevo, setPaqueteIdNuevo] = useState("");
	const [montoItemNuevo, setMontoItemNuevo] = useState("");

	// Carrito: items ya agregados a esta cuenta (como la cuenta de un restaurante --
	// varios servicios/paquetes, un solo total y un solo abono/saldo combinado)
	const [carrito, setCarrito] = useState([]);

	const [tipoPago, setTipoPago] = useState("completo"); // "completo" | "abono"
	const [montoAbono, setMontoAbono] = useState("");
	const [metodoPago, setMetodoPago] = useState("efectivo"); // "efectivo" | "tarjeta" | "transferencia"

	// Estados de control y feedback
	const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState(null);
	const [exito, setExito] = useState(null);
	const [filtroDeuda, setFiltroDeuda] = useState(false);

	// Cargar catálogos iniciales
	const cargarDatos = useCallback(async () => {
		if (!token) return;
		setCargandoCatalogos(true);
		setError(null);
		try {
			const [resPacientes, resServicios, resVentas] = await Promise.all([
				obtenerPacientes(token).catch(() => []),
				listarServicios(token).catch(() => []),
				listarVentas(token, filtroDeuda ? { con_deuda: true } : {}).catch(() => [])
			]);
			setPacientes(Array.isArray(resPacientes) ? resPacientes : []);
			setServicios(Array.isArray(resServicios) ? resServicios : []);
			setVentas(Array.isArray(resVentas) ? resVentas : []);
		} catch (err) {
			setError(err.message || "Error al cargar catálogos.");
		} finally {
			setCargandoCatalogos(false);
		}
	}, [token, filtroDeuda]);

	useEffect(() => {
		cargarDatos();
	}, [cargarDatos]);

	// Cargar los paquetes ya comprados por el paciente seleccionado (para poder
	// venderle una sesión) y vaciar la cuenta en curso al cambiar de paciente.
	useEffect(() => {
		setCarrito([]);
		setServicioIdNuevo("");
		setPaqueteIdNuevo("");
		setMontoItemNuevo("");

		if (!pacienteId || !token) {
			setPaquetesPaciente([]);
			return;
		}

		setCargandoPaquetesPaciente(true);
		listarPaquetesDePaciente(token, pacienteId)
			.then((res) => setPaquetesPaciente(Array.isArray(res) ? res : []))
			.catch(() => setPaquetesPaciente([]))
			.finally(() => setCargandoPaquetesPaciente(false));
	}, [pacienteId, token]);

	// Total de la cuenta = suma de los items agregados hasta ahora
	const montoFinalTotal = carrito.reduce((suma, item) => suma + (Number(item.monto) || 0), 0);
	const montoFinalPago = tipoPago === "completo" ? montoFinalTotal : Number(montoAbono) || 0;
	const deudaEstimada = Math.max(0, montoFinalTotal - montoFinalPago);

	// Si el pago es "completo", el abono sigue el total conforme se agregan/quitan items
	useEffect(() => {
		if (tipoPago === "completo") {
			setMontoAbono(montoFinalTotal);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [carrito, tipoPago]);

	const paqueteSeleccionadoNuevo = paquetesPaciente.find((p) => String(p.id) === String(paqueteIdNuevo));

	// Auto-completar precio del catálogo al seleccionar servicio para agregar
	const handleSeleccionarServicioNuevo = (id) => {
		setServicioIdNuevo(id);
		const servicioEncontrado = servicios.find((s) => String(s.id) === String(id));
		setMontoItemNuevo(servicioEncontrado ? String(servicioEncontrado.precio ?? "") : "");
	};

	// Al elegir un paquete: si es de contado la sesión cuesta $0 (ya se pagó al
	// comprar el paquete); si es a plazos, el usuario captura la cuota.
	const handleSeleccionarPaqueteNuevo = (id) => {
		setPaqueteIdNuevo(id);
		const paquetePac = paquetesPaciente.find((p) => String(p.id) === String(id));
		setMontoItemNuevo(paquetePac && paquetePac.forma_pago === "contado" ? "0" : "");
	};

	const handleAgregarItem = () => {
		const monto = Number(montoItemNuevo) || 0;

		if (tipoItemNuevo === "servicio") {
			if (!servicioIdNuevo) return;
			const servicio = servicios.find((s) => String(s.id) === String(servicioIdNuevo));
			setCarrito((prev) => [
				...prev,
				{
					uid: `s-${servicioIdNuevo}-${Date.now()}`,
					tipo: "servicio",
					servicioId: Number(servicioIdNuevo),
					nombre: servicio ? servicio.nombre : "Servicio",
					monto
				}
			]);
			setServicioIdNuevo("");
		} else {
			if (!paqueteIdNuevo) return;
			const paquetePac = paquetesPaciente.find((p) => String(p.id) === String(paqueteIdNuevo));
			setCarrito((prev) => [
				...prev,
				{
					uid: `p-${paqueteIdNuevo}-${Date.now()}`,
					tipo: "paquete",
					paqueteId: Number(paqueteIdNuevo),
					nombre: paquetePac ? paquetePac.paquete_nombre || `Paquete #${paquetePac.id}` : "Paquete",
					monto
				}
			]);
			setPaqueteIdNuevo("");
		}

		setMontoItemNuevo("");
	};

	const handleQuitarItem = (uid) => {
		setCarrito((prev) => prev.filter((item) => item.uid !== uid));
	};

	// Cambiar modo de pago (completo vs abono)
	const handleTipoPagoChange = (tipo) => {
		setTipoPago(tipo);
		setMontoAbono(tipo === "completo" ? montoFinalTotal : "");
	};

	// Enviar formulario
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setExito(null);

		if (!pacienteId) {
			setError("Debes seleccionar un paciente.");
			return;
		}

		if (carrito.length === 0) {
			setError("Agrega al menos un servicio o paquete a la cuenta.");
			return;
		}

		if (montoFinalPago < 0) {
			setError("El monto a pagar/abonar no puede ser negativo.");
			return;
		}

		if (montoFinalPago > montoFinalTotal) {
			setError("El abono no puede ser mayor que el monto total.");
			return;
		}

		setGuardando(true);

		try {
			const payload = {
				paciente_id: Number(pacienteId),
				items: carrito.map((item) =>
					item.tipo === "servicio"
						? { servicio_id: item.servicioId, monto: item.monto }
						: { paquete_paciente_id: item.paqueteId, monto: item.monto }
				),
				pago_monto: montoFinalPago,
				pago_metodo: metodoPago
			};

			await registrarVenta(token, payload);

			setExito("¡Venta registrada exitosamente!");
			// Limpiar formulario
			setPacienteId("");
			setCarrito([]);
			setTipoPago("completo");
			setMetodoPago("efectivo");

			// Recargar ventas
			const resVentas = await listarVentas(token, filtroDeuda ? { con_deuda: true } : {});
			setVentas(Array.isArray(resVentas) ? resVentas : []);
		} catch (err) {
			setError(err.message || "Error al procesar la venta.");
		} finally {
			setGuardando(false);
		}
	};

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{/* Encabezado */}
			<div className="mb-8">
				<h1 className="font-display text-3xl font-bold text-ink">Ventas y Facturación</h1>
				<p className="mt-1 text-sm text-ink-soft">
					Registra cobros de servicios y paquetes, gestiona abonos y consulta el estado de cuenta.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
				{/* Columna Izquierda: Formulario de Nueva Venta */}
				<div className="lg:col-span-5">
					<div className="rounded-2xl border border-ink/[0.08] bg-paper p-6 shadow-sm">
						<h2 className="font-display text-xl font-semibold text-ink mb-4">Nueva Venta / Cobro</h2>

						{error && (
							<div className="mb-4 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
								{error}
							</div>
						)}

						{exito && (
							<div className="mb-4 rounded-xl bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 border border-emerald-200">
								{exito}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* 1. Selección de Paciente */}
							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
									Paciente *
								</label>
								<select
									value={pacienteId}
									onChange={(e) => setPacienteId(e.target.value)}
									disabled={cargandoCatalogos}
									required
									className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
								>
									<option value="">-- Seleccionar Paciente --</option>
									{pacientes.map((p) => (
										<option key={p.id} value={p.id}>
											{p.nombre_completo} {p.telefono ? `(Céd: ${p.telefono})` : ""}
										</option>
									))}
								</select>
							</div>

							{/* 2. Agregar servicios/paquetes a la cuenta */}
							<div className="space-y-3 rounded-xl border border-ink/[0.1] bg-nude/20 p-3.5">
								<label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
									Agregar a la cuenta
								</label>

								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setTipoItemNuevo("servicio")}
										className={`rounded-xl py-2 text-xs font-semibold transition-all ${
											tipoItemNuevo === "servicio"
												? "bg-ink text-paper shadow-sm"
												: "border border-ink/[0.15] bg-white text-ink-soft hover:bg-nude"
										}`}
									>
										Servicio
									</button>
									<button
										type="button"
										onClick={() => setTipoItemNuevo("paquete")}
										className={`rounded-xl py-2 text-xs font-semibold transition-all ${
											tipoItemNuevo === "paquete"
												? "bg-ink text-paper shadow-sm"
												: "border border-ink/[0.15] bg-white text-ink-soft hover:bg-nude"
										}`}
									>
										Paquete del paciente
									</button>
								</div>

								{tipoItemNuevo === "servicio" ? (
									<select
										value={servicioIdNuevo}
										onChange={(e) => handleSeleccionarServicioNuevo(e.target.value)}
										disabled={cargandoCatalogos}
										className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
									>
										<option value="">-- Seleccionar Servicio --</option>
										{servicios.map((s) => (
											<option key={s.id} value={s.id}>
												{s.nombre} — {formatMoney(s.precio)}
											</option>
										))}
									</select>
								) : !pacienteId ? (
									<p className="text-xs text-ink-soft">Selecciona un paciente primero.</p>
								) : cargandoPaquetesPaciente ? (
									<p className="text-xs text-ink-soft">Cargando paquetes…</p>
								) : paquetesPaciente.length === 0 ? (
									<p className="text-xs text-ink-soft">Este paciente no tiene paquetes activos.</p>
								) : (
									<select
										value={paqueteIdNuevo}
										onChange={(e) => handleSeleccionarPaqueteNuevo(e.target.value)}
										className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
									>
										<option value="">-- Seleccionar Paquete --</option>
										{paquetesPaciente.map((p) => (
											<option key={p.id} value={p.id}>
												{p.paquete_nombre || `Paquete #${p.id}`} ({p.forma_pago === "contado" ? "contado" : "a plazos"})
											</option>
										))}
									</select>
								)}

								<div className="flex items-end gap-2">
									<div className="flex-1">
										<label className="mb-1 block text-[11px] font-medium text-ink-soft">Monto de este item</label>
										<input
											type="number"
											step="0.01"
											min="0"
											value={montoItemNuevo}
											onChange={(e) => setMontoItemNuevo(e.target.value)}
											disabled={tipoItemNuevo === "paquete" && paqueteSeleccionadoNuevo?.forma_pago === "contado"}
											placeholder="0.00"
											className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2 text-sm font-semibold text-ink focus:border-ink focus:outline-none disabled:bg-ink/[0.03]"
										/>
									</div>
									<button
										type="button"
										onClick={handleAgregarItem}
										disabled={tipoItemNuevo === "servicio" ? !servicioIdNuevo : !paqueteIdNuevo}
										className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-paper hover:bg-cafe disabled:opacity-40"
									>
										+ Agregar
									</button>
								</div>
							</div>

							{/* 3. Cuenta actual (carrito) */}
							<div>
								<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
									Cuenta actual {carrito.length > 0 ? `(${carrito.length})` : ""}
								</label>
								{carrito.length === 0 ? (
									<p className="rounded-xl border border-dashed border-ink/[0.15] p-3 text-xs text-ink-soft">
										Todavía no has agregado nada a la cuenta.
									</p>
								) : (
									<ul className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.1] bg-white">
										{carrito.map((item) => (
											<li key={item.uid} className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs">
												<span className="text-ink">{item.nombre}</span>
												<span className="flex items-center gap-2">
													<span className="font-semibold text-ink">{formatMoney(item.monto)}</span>
													<button
														type="button"
														onClick={() => handleQuitarItem(item.uid)}
														aria-label={`Quitar ${item.nombre}`}
														className="text-ink-soft hover:text-red-600"
													>
														✕
													</button>
												</span>
											</li>
										))}
									</ul>
								)}
							</div>

							{/* 4. Modalidad de Pago: Pago Completo o Abono */}
							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
									Modalidad de Pago
								</label>
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => handleTipoPagoChange("completo")}
										className={`rounded-xl py-2 text-xs font-semibold transition-all ${
											tipoPago === "completo"
												? "bg-ink text-paper shadow-sm"
												: "border border-ink/[0.15] bg-white text-ink-soft hover:bg-nude"
										}`}
									>
										Pago Completo
									</button>
									<button
										type="button"
										onClick={() => handleTipoPagoChange("abono")}
										className={`rounded-xl py-2 text-xs font-semibold transition-all ${
											tipoPago === "abono"
												? "bg-ink text-paper shadow-sm"
												: "border border-ink/[0.15] bg-white text-ink-soft hover:bg-nude"
										}`}
									>
										Abono / Cuota
									</button>
								</div>
							</div>

							{/* Monto de Abono si seleccionó pago parcial */}
							{tipoPago === "abono" && (
								<div className="rounded-xl bg-nude/40 p-3.5 border border-ink/[0.06]">
									<label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
										Monto a Abonar Hoy *
									</label>
									<input
										type="number"
										step="0.01"
										min="0.01"
										max={montoFinalTotal || undefined}
										value={montoAbono}
										onChange={(e) => setMontoAbono(e.target.value)}
										placeholder="Ingrese monto del abono"
										required
										className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2 text-sm font-semibold text-ink focus:border-ink focus:outline-none"
									/>
									<div className="mt-2 flex justify-between text-xs text-ink-soft font-medium">
										<span>Saldo pendiente restante:</span>
										<span className="font-semibold text-amber-800">{formatMoney(deudaEstimada)}</span>
									</div>
								</div>
							)}

							{/* 5. Método de Pago */}
							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
									Método de Pago
								</label>
								<select
									value={metodoPago}
									onChange={(e) => setMetodoPago(e.target.value)}
									className="w-full rounded-xl border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm text-ink focus:border-inkfocus:outline-none"
								>
									<option value="efectivo">Efectivo</option>
									<option value="tarjeta">Tarjeta (Débito/Crédito)</option>
									<option value="transferencia">Transferencia Bancaria / SINPE</option>
								</select>
							</div>

							{/* Resumen de cobro */}
							<div className="rounded-xl bg-ink/[0.03] p-3 text-xs space-y-1 text-ink-soft border border-ink/[0.05]">
								<div className="flex justify-between">
									<span>Total a Facturar:</span>
									<span className="font-semibold text-ink">{formatMoney(montoFinalTotal)}</span>
								</div>
								<div className="flex justify-between">
									<span>Cobro a registrar hoy:</span>
									<span className="font-semibold text-emerald-700">{formatMoney(montoFinalPago)}</span>
								</div>
								{deudaEstimada > 0 && (
									<div className="flex justify-between pt-1 border-t border-ink/[0.08]">
										<span className="font-medium text-amber-800">Queda como deuda:</span>
										<span className="font-bold text-amber-800">{formatMoney(deudaEstimada)}</span>
									</div>
								)}
							</div>

							{/* Botón Guardar */}
							<button
								type="submit"
								disabled={guardando || cargandoCatalogos}
								className="w-full rounded-full bg-ink py-3 text-sm font-bold text-paper transition hover:bg-cafe disabled:opacity-50"
							>
								{guardando ? "Procesando venta..." : "Registrar Venta"}
							</button>
						</form>
					</div>
				</div>

				{/* Columna Derecha: Historial de Ventas y Cobros */}
				<div className="lg:col-span-7">
					<div className="rounded-2xl border border-ink/[0.08] bg-paper p-6 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-display text-xl font-semibold text-ink">Historial de Ventas</h2>

							<button
								type="button"
								onClick={() => setFiltroDeuda(!filtroDeuda)}
								className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
									filtroDeuda
										? "bg-amber-600 text-white"
										: "border border-ink/[0.15] bg-white text-ink-soft hover:bg-nude"
								}`}
							>
								{filtroDeuda ? "Mostrando: Con Deuda" : "Filtrar: Solo con Deuda"}
							</button>
						</div>

						{cargandoCatalogos ? (
							<p className="py-8 text-center text-sm text-ink-soft">Cargando registros...</p>
						) : ventas.length === 0 ? (
							<div className="rounded-xl border border-dashed border-ink/[0.15] py-12 text-center text-sm text-ink-soft">
								No hay ventas registradas {filtroDeuda ? "con deuda pendiente" : ""}.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead>
										<tr className="border-b border-ink/[0.08] text-ink-soft">
											<th className="pb-3 font-semibold uppercase">ID / Fecha</th>
											<th className="pb-3 font-semibold uppercase">Paciente</th>
											<th className="pb-3 font-semibold uppercase">Total</th>
											<th className="pb-3 font-semibold uppercase">Abonado</th>
											<th className="pb-3 font-semibold uppercase">Estado / Deuda</th>
											<th className="pb-3 font-semibold uppercase"></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-ink/[0.05]">
										{ventas.map((v) => {
											const tieneDeuda = (v.deuda_pendiente || 0) > 0;
											const pacienteObj = pacientes.find((p) => p.id === v.paciente_id);
											return (
												<tr key={v.id} className="hover:bg-ink/[0.01]">
													<td className="py-3">
														<span className="font-semibold text-ink">#{v.id}</span>
														<div className="text-[11px] text-ink-soft">
															{v.fecha ? new Date(v.fecha).toLocaleDateString("es-CR") : "-"}
														</div>
													</td>
													<td className="py-3 font-medium text-ink">
														{pacienteObj ? pacienteObj.nombre_completo : `Paciente #${v.paciente_id}`}
													</td>
													<td className="py-3 font-semibold text-ink">{formatMoney(v.monto_total)}</td>
													<td className="py-3 text-emerald-700 font-medium">{formatMoney(v.monto_abonado)}</td>
													<td className="py-3">
														{tieneDeuda ? (
															<span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
																Debe {formatMoney(v.deuda_pendiente)}
															</span>
														) : (
															<span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
																Saldado
															</span>
														)}
													</td>
													<td className="py-3 text-right">
														<Link to={`/app/ventas/${v.id}/recibo`} className="font-semibold text-cafe hover:underline">
															Recibo
														</Link>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
