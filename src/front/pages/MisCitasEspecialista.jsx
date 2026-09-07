import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { obtenerMisCitasEspecialista } from "../services/dashboard.js";

const formatMoney = (amount) =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount || 0);

const formatFechaHora = (fecha) =>
	fecha ? new Date(fecha).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const MisCitasEspecialista = () => {
	const { store } = useGlobalReducer();
	const token = store.token;
	const usuario = store.usuario;

	const [rango, setRango] = useState("semana");
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");
	const [mostrarModalFiltro, setMostrarModalFiltro] = useState(false);
	const [resumen, setResumen] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);

	const cargar = useCallback(async () => {
		if (!token) return;
		setCargando(true);
		setError(null);
		try {
			const params = {};
			if (rango === "personalizado") {
				if (desde) params.desde = desde;
				if (hasta) params.hasta = hasta;
			} else {
				params.rango = rango;
			}
			setResumen(await obtenerMisCitasEspecialista(token, params));
		} catch (err) {
			setError(err.message || "No se pudieron cargar tus citas y comisiones.");
		} finally {
			setCargando(false);
		}
	}, [token, rango, desde, hasta]);

	useEffect(() => {
		cargar();
	}, [cargar]);

	if (usuario && usuario.rol !== "especialista") {
		return <Navigate to="/app/agenda" replace />;
	}

	const citasComision = resumen?.comisiones?.citas || [];
	const programadas = resumen?.programadas || [];

	return (
		<div className="min-h-screen bg-paper px-4 py-8 font-body text-ink md:px-8 lg:px-12">
			<div className="mx-auto mb-8 max-w-5xl">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="font-display text-3xl font-medium text-ink">
							Mis citas y comisiones, <span className="italic text-cafe">{usuario?.nombre}</span>
						</h1>
						<p className="mt-1 text-sm text-ink-soft">
							Comisión de tus citas completadas y tu agenda programada en el periodo.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 rounded-sm border border-nude/40 bg-paper-alt p-1.5 shadow-card">
						<button
							onClick={() => setRango("hoy")}
							className={`rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
								rango === "hoy" ? "bg-cafe text-white shadow-soft" : "text-ink-soft hover:bg-paper hover:text-ink"
							}`}
						>
							Hoy
						</button>
						<button
							onClick={() => setRango("semana")}
							className={`rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
								rango === "semana" ? "bg-cafe text-white shadow-soft" : "text-ink-soft hover:bg-paper hover:text-ink"
							}`}
						>
							Esta Semana
						</button>
						<button
							onClick={() => setRango("mes")}
							className={`rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
								rango === "mes" ? "bg-cafe text-white shadow-soft" : "text-ink-soft hover:bg-paper hover:text-ink"
							}`}
						>
							Este Mes
						</button>
						<button
							onClick={() => setMostrarModalFiltro(true)}
							className={`rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
								rango === "personalizado"
									? "bg-cafe text-white shadow-soft"
									: "text-ink-soft hover:bg-paper hover:text-ink"
							}`}
						>
							Fechas
						</button>
					</div>
				</div>

				{resumen?.rango_filtrado && (
					<div className="mt-3 flex items-center gap-2 font-data text-xs text-ink-faint">
						<span>Filtrando del:</span>
						<span className="font-semibold text-cafe">{resumen.rango_filtrado.desde}</span>
						<span>al</span>
						<span className="font-semibold text-cafe">{resumen.rango_filtrado.hasta}</span>
					</div>
				)}
			</div>

			{error && (
				<div className="mx-auto mb-6 flex max-w-5xl items-center justify-between rounded-sm border border-error-text/20 bg-error-bg p-4 text-error-text">
					<span className="text-sm font-medium">{error}</span>
					<button onClick={cargar} className="text-xs font-semibold underline">
						Reintentar
					</button>
				</div>
			)}

			<div className="mx-auto max-w-5xl space-y-6">
				{/* Resumen de comisión del periodo */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<div className="rounded-md border border-nude/30 bg-white p-6 shadow-card">
						<span className="mb-2 block font-data text-xs font-semibold uppercase tracking-wider text-ink-faint">
							Comisión del periodo
						</span>
						<div className="font-display text-2xl font-semibold text-ink lg:text-3xl">
							{cargando ? "…" : formatMoney(resumen?.comisiones?.total_comision)}
						</div>
						<p className="mt-2 font-data text-xs text-ink-soft">
							{cargando ? "" : resumen?.comisiones?.total_citas || 0} citas completadas
						</p>
					</div>
					<div className="rounded-md border border-nude/30 bg-white p-6 shadow-card">
						<span className="mb-2 block font-data text-xs font-semibold uppercase tracking-wider text-ink-faint">
							Citas programadas
						</span>
						<div className="font-display text-2xl font-semibold text-ink lg:text-3xl">
							{cargando ? "…" : programadas.length}
						</div>
						<p className="mt-2 font-data text-xs text-ink-soft">En el mismo periodo</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
					{/* Citas completadas / comisiones */}
					<div className="rounded-md border border-nude/30 bg-white p-6 shadow-card lg:col-span-7">
						<h2 className="mb-1 font-display text-xl font-medium text-ink">Citas completadas</h2>
						<p className="mb-4 text-xs text-ink-soft">Comisión calculada sobre el precio de catálogo del servicio</p>

						{cargando ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-14 animate-pulse rounded-xs bg-paper-alt"></div>
								))}
							</div>
						) : citasComision.length === 0 ? (
							<div className="py-8 text-center text-sm text-ink-faint">No completaste citas en este periodo.</div>
						) : (
							<div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
								{citasComision.map((c) => (
									<div
										key={c.id}
										className="flex items-center justify-between gap-3 rounded-xs border border-nude/30 bg-paper/50 p-3 text-sm"
									>
										<div>
											<h4 className="font-semibold text-ink">{c.paciente_nombre || "Paciente"}</h4>
											<p className="text-xs text-ink-soft">
												{c.servicio_nombre} · {formatFechaHora(c.fecha_hora)}
											</p>
										</div>
										<div className="text-right">
											<div className="font-data text-xs text-ink-soft">{formatMoney(c.monto_servicio)}</div>
											<div className="font-data text-sm font-semibold text-emerald-700">+{formatMoney(c.comision)}</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Citas programadas */}
					<div className="rounded-md border border-nude/30 bg-white p-6 shadow-card lg:col-span-5">
						<h2 className="mb-1 font-display text-xl font-medium text-ink">Programadas</h2>
						<p className="mb-4 text-xs text-ink-soft">Tu agenda en este periodo</p>

						{cargando ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="h-14 animate-pulse rounded-xs bg-paper-alt"></div>
								))}
							</div>
						) : programadas.length === 0 ? (
							<div className="py-8 text-center text-sm text-ink-faint">No tienes citas programadas.</div>
						) : (
							<div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
								{programadas.map((c) => (
									<div key={c.id} className="rounded-xs border border-nude/30 bg-paper/50 p-3 text-sm">
										<h4 className="font-semibold text-ink">{c.paciente_nombre || "Paciente"}</h4>
										<p className="text-xs text-ink-soft">
											{c.servicio_nombre} · {c.espacio_nombre}
										</p>
										<p className="mt-1 font-data text-xs text-ink-faint">{formatFechaHora(c.fecha_hora)}</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{mostrarModalFiltro && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
					<div className="w-full max-w-sm rounded-md bg-white p-6 shadow-glass">
						<h3 className="mb-4 font-display text-lg font-medium text-ink">Filtrar Fechas</h3>
						<div className="space-y-3">
							<div>
								<label className="mb-1 block text-xs font-semibold text-ink-soft">Desde</label>
								<input
									type="date"
									value={desde}
									onChange={(e) => setDesde(e.target.value)}
									className="w-full rounded-xs border border-nude p-2 text-sm"
								/>
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold text-ink-soft">Hasta</label>
								<input
									type="date"
									value={hasta}
									onChange={(e) => setHasta(e.target.value)}
									className="w-full rounded-xs border border-nude p-2 text-sm"
								/>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button
								onClick={() => setMostrarModalFiltro(false)}
								className="px-3 py-1.5 text-xs font-semibold text-ink-soft"
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									setRango("personalizado");
									setMostrarModalFiltro(false);
								}}
								className="rounded-xs bg-cafe px-4 py-1.5 text-xs font-semibold text-white"
							>
								Aplicar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
