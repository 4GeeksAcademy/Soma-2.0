import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { obtenerPaciente } from "../services/pacientes";

const formatMoney = (amount) =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount || 0);

const formatFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString("es-VE") : "-");
const formatFechaHora = (fecha) =>
	fecha ? new Date(fecha).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" }) : "-";

const ESTADOS_CITA = {
	agendada: { texto: "Agendada", clase: "bg-blue-50 text-blue-700 border-blue-200" },
	reprogramada: { texto: "Reprogramada", clase: "bg-amber-50 text-amber-700 border-amber-200" },
	completada: { texto: "Completada", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
	cancelada: { texto: "Cancelada", clase: "bg-red-50 text-red-700 border-red-200" }
};

const Badge = ({ texto, clase }) => (
	<span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${clase}`}>{texto}</span>
);

Badge.propTypes = {
	texto: PropTypes.string.isRequired,
	clase: PropTypes.string.isRequired
};

const Seccion = ({ titulo, subtitulo, children }) => (
	<div className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
		<h2 className="font-display text-lg font-semibold text-cafe">{titulo}</h2>
		{subtitulo ? <p className="mb-4 mt-0.5 text-[13px] text-ink-soft">{subtitulo}</p> : <div className="mb-4" />}
		{children}
	</div>
);

Seccion.propTypes = {
	titulo: PropTypes.string.isRequired,
	subtitulo: PropTypes.string,
	children: PropTypes.node.isRequired
};

export const FichaPaciente = () => {
	const { id } = useParams();
	const { store } = useGlobalReducer();
	const [paciente, setPaciente] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const cargar = async () => {
			setCargando(true);
			setError("");
			try {
				setPaciente(await obtenerPaciente(store.token, id));
			} catch (err) {
				setError(err.message || "No se pudo cargar la ficha del paciente.");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	}, [id, store.token]);

	if (cargando) {
		return <div className="p-8 text-center text-ink-faint">Cargando ficha…</div>;
	}

	if (error || !paciente) {
		return (
			<div className="mx-auto max-w-md px-6 py-16 text-center">
				<h1 className="mb-2 text-2xl">No se pudo cargar la ficha</h1>
				<p className="text-ink-soft">{error}</p>
				<Link to="/app/pacientes" className="mt-4 inline-block text-cafe hover:underline">
					← Volver a Pacientes
				</Link>
			</div>
		);
	}

	const { citas, historial_clinico, paquetes, ventas } = paciente;

	return (
		<div className="min-h-screen bg-paper p-8 font-body text-ink">
			<div className="mx-auto max-w-5xl">
				<Link to="/app/pacientes" className="text-[13.5px] text-ink-soft hover:text-cafe hover:underline">
					← Volver a Pacientes
				</Link>

				{/* Encabezado */}
				<div className="mb-8 mt-3 flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="font-display text-3xl font-bold text-cafe">{paciente.nombre_completo}</h1>
						<p className="mt-1 font-data text-[14px] text-ink-soft">
							Cédula {paciente.cedula} · Tel. {paciente.telefono}
							{paciente.edad ? ` · ${paciente.edad} años` : ""}
							{paciente.ocupacion ? ` · ${paciente.ocupacion}` : ""}
						</p>
					</div>
					<Badge
						texto={paciente.activo === false ? "Inactivo" : "Activo"}
						clase={
							paciente.activo === false
								? "bg-red-50 text-red-700 border-red-200"
								: "bg-emerald-50 text-emerald-700 border-emerald-200"
						}
					/>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* Datos clínicos */}
					<Seccion titulo="Datos clínicos">
						<dl className="grid grid-cols-2 gap-4 text-[13.5px]">
							<div>
								<dt className="font-data text-[11px] uppercase tracking-wider text-ink-faint">Tipo de piel</dt>
								<dd className="text-ink">{paciente.tipo_piel || "No registrado"}</dd>
							</div>
							<div>
								<dt className="font-data text-[11px] uppercase tracking-wider text-ink-faint">Alergias</dt>
								<dd className="text-ink">{paciente.alergias || "Ninguna registrada"}</dd>
							</div>
							<div className="col-span-2">
								<dt className="font-data text-[11px] uppercase tracking-wider text-ink-faint">
									Consentimiento informado
								</dt>
								<dd className="text-ink">
									{paciente.firma_consentimiento
										? `Firmado el ${formatFecha(paciente.fecha_firma_consentimiento)}`
										: "Sin firmar"}
								</dd>
							</div>
						</dl>
					</Seccion>

					{/* Estado de cuenta */}
					<Seccion titulo="Estado de cuenta" subtitulo="Ventas y saldo pendiente">
						{ventas.length === 0 ? (
							<p className="text-[13.5px] text-ink-soft">Este paciente no tiene ventas registradas.</p>
						) : (
							<ul className="divide-y divide-beige/60">
								{ventas.map((venta) => (
									<li key={venta.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
										<div>
											<Link to={`/app/ventas/${venta.id}/recibo`} className="font-medium text-cafe hover:underline">
												Venta #{venta.id}
											</Link>
											<p className="text-[12px] text-ink-faint">{formatFecha(venta.fecha)}</p>
										</div>
										<div className="text-right">
											<p className="font-semibold text-ink">{formatMoney(venta.monto_total)}</p>
											{venta.deuda_pendiente > 0 ? (
												<p className="text-[12px] font-medium text-amber-700">
													Debe {formatMoney(venta.deuda_pendiente)}
												</p>
											) : (
												<p className="text-[12px] font-medium text-emerald-700">Saldado</p>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</Seccion>

					{/* Paquetes */}
					<Seccion titulo="Paquetes" subtitulo="Comprados por este paciente">
						{paquetes.length === 0 ? (
							<p className="text-[13.5px] text-ink-soft">Este paciente no tiene paquetes.</p>
						) : (
							<ul className="divide-y divide-beige/60">
								{paquetes.map((pp) => {
									const pendientes = pp.sesiones.filter((s) => s.estado === "pendiente").length;
									return (
										<li key={pp.id} className="py-2.5 text-[13.5px]">
											<div className="flex items-center justify-between gap-2">
												<p className="font-medium text-ink">{pp.paquete_nombre || `Paquete #${pp.id}`}</p>
												<Badge
													texto={pp.estado === "activo" ? "Activo" : "Agotado"}
													clase={
														pp.estado === "activo"
															? "bg-emerald-50 text-emerald-700 border-emerald-200"
															: "bg-ink/[0.05] text-ink-soft border-ink/[0.1]"
													}
												/>
											</div>
											<p className="mt-1 text-[12.5px] text-ink-soft">
												{pp.forma_pago === "contado" ? "Pago de contado" : "Pago a plazos"} · comprado el{" "}
												{formatFecha(pp.fecha_compra)}
											</p>
											<p className="mt-1 text-[12.5px] text-ink-soft">
												{pendientes} de {pp.sesiones.length} sesiones pendientes
											</p>
										</li>
									);
								})}
							</ul>
						)}
					</Seccion>

					{/* Citas */}
					<Seccion titulo="Historial de citas">
						{citas.length === 0 ? (
							<p className="text-[13.5px] text-ink-soft">Este paciente no tiene citas registradas.</p>
						) : (
							<ul className="divide-y divide-beige/60">
								{citas.map((cita) => {
									const estado = ESTADOS_CITA[cita.estado] || {
										texto: cita.estado,
										clase: "bg-ink/[0.05] text-ink-soft border-ink/[0.1]"
									};
									return (
										<li key={cita.id} className="py-2.5 text-[13.5px]">
											<div className="flex items-center justify-between gap-2">
												<p className="font-medium text-ink">{formatFechaHora(cita.fecha_hora)}</p>
												<Badge texto={estado.texto} clase={estado.clase} />
											</div>
											<p className="mt-0.5 text-[12.5px] text-ink-soft">
												{[cita.servicio_nombre, cita.especialista_nombre, cita.espacio_nombre]
													.filter(Boolean)
													.join(" · ")}
											</p>
										</li>
									);
								})}
							</ul>
						)}
					</Seccion>
				</div>

				{/* Historial clínico -- ancho completo, con fotos */}
				<div className="mt-6">
					<Seccion titulo="Historial clínico" subtitulo="Observaciones y fotos por visita">
						{historial_clinico.length === 0 ? (
							<p className="text-[13.5px] text-ink-soft">Todavía no hay registros de historial clínico.</p>
						) : (
							<ul className="divide-y divide-beige/60">
								{historial_clinico.map((registro) => (
									<li key={registro.id} className="py-3.5">
										<p className="font-data text-[12px] uppercase tracking-wider text-ink-faint">
											{formatFechaHora(registro.cita_fecha)}
										</p>
										<p className="mt-1 text-[13.5px] text-ink">{registro.observaciones || "Sin observaciones."}</p>
										{(registro.foto_antes_url || registro.foto_despues_url) && (
											<div className="mt-2 flex flex-wrap gap-4 text-[12.5px]">
												{registro.foto_antes_url && (
													<a
														href={registro.foto_antes_url}
														target="_blank"
														rel="noreferrer"
														className="text-cafe hover:underline"
													>
														Foto antes ↗
													</a>
												)}
												{registro.foto_despues_url && (
													<a
														href={registro.foto_despues_url}
														target="_blank"
														rel="noreferrer"
														className="text-cafe hover:underline"
													>
														Foto después ↗
													</a>
												)}
											</div>
										)}
									</li>
								))}
							</ul>
						)}
					</Seccion>
				</div>
			</div>
		</div>
	);
};
