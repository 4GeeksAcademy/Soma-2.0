import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { listarEspacios, crearEspacio, actualizarEspacio, eliminarEspacio } from "../services/espacios";

const TIPOS = ["sala", "cama", "estación"];

const formVacio = { nombre: "", tipo: TIPOS[0] };

export const Espacios = () => {
	const { store } = useGlobalReducer();
	const [espacios, setEspacios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState("");
	const [form, setForm] = useState(formVacio);
	const [editandoId, setEditandoId] = useState(null);
	const [guardando, setGuardando] = useState(false);

	const cargarEspacios = async () => {
		setCargando(true);
		setError("");
		try {
			setEspacios(await listarEspacios(store.token));
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarEspacios();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const empezarEdicion = (espacio) => {
		setEditandoId(espacio.id);
		setForm({ nombre: espacio.nombre, tipo: espacio.tipo });
	};

	const cancelarEdicion = () => {
		setEditandoId(null);
		setForm(formVacio);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setGuardando(true);
		try {
			if (editandoId) {
				await actualizarEspacio(store.token, editandoId, form);
			} else {
				await crearEspacio(store.token, form);
			}
			cancelarEdicion();
			await cargarEspacios();
		} catch (err) {
			setError(err.message);
		} finally {
			setGuardando(false);
		}
	};

	const handleEliminar = async (espacio) => {
		if (!window.confirm(`¿Eliminar "${espacio.nombre}"? Esta acción no se puede deshacer.`)) return;
		setError("");
		try {
			await eliminarEspacio(store.token, espacio.id);
			if (editandoId === espacio.id) cancelarEdicion();
			await cargarEspacios();
		} catch (err) {
			setError(err.message);
		}
	};

	if (store.usuario?.rol !== "admin") {
		return (
			<div className="mx-auto max-w-3xl px-6 py-16 text-center">
				<h1 className="mb-2 text-2xl">No autorizado</h1>
				<p className="text-ink-soft">Espacios de Trabajo solo lo puede administrar el Admin.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-6 py-10">
			<h1 className="mb-1 text-2xl">Espacios de Trabajo</h1>
			<p className="mb-8 text-[14.5px] text-ink-soft">
				Salas, camas y estaciones que la Agenda usa para evitar choques de recursos.
			</p>

			{error ? (
				<div className="mb-5 rounded-sm bg-error-bg px-4 py-3 text-[13.5px] text-error-text">{error}</div>
			) : null}

			<form
				onSubmit={handleSubmit}
				className="mb-8 flex flex-wrap items-end gap-3 rounded-md border border-ink/[0.08] bg-paper-alt p-5"
			>
				<div className="min-w-[200px] flex-1">
					<label className="mb-1.5 block text-[13px] font-semibold text-ink-soft" htmlFor="nombre">
						Nombre
					</label>
					<input
						id="nombre"
						type="text"
						required
						placeholder="Sala 2"
						className="w-full rounded-sm border-[1.5px] border-beige bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-cafe focus:ring-4 focus:ring-cafe/[0.14]"
						value={form.nombre}
						onChange={(event) => setForm({ ...form, nombre: event.target.value })}
					/>
				</div>

				<div>
					<label className="mb-1.5 block text-[13px] font-semibold text-ink-soft" htmlFor="tipo">
						Tipo
					</label>
					<select
						id="tipo"
						className="rounded-sm border-[1.5px] border-beige bg-paper px-4 py-2.5 text-[15px] text-ink outline-none focus:border-cafe focus:ring-4 focus:ring-cafe/[0.14]"
						value={form.tipo}
						onChange={(event) => setForm({ ...form, tipo: event.target.value })}
					>
						{TIPOS.map((tipo) => (
							<option key={tipo} value={tipo}>
								{tipo}
							</option>
						))}
					</select>
				</div>

				<button
					type="submit"
					disabled={guardando}
					className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-paper hover:bg-cafe disabled:opacity-60"
				>
					{guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "+ Nuevo espacio"}
				</button>

				{editandoId ? (
					<button
						type="button"
						onClick={cancelarEdicion}
						className="rounded-full border-[1.5px] border-beige px-6 py-2.5 text-[14px] font-semibold text-ink-soft hover:border-cafe hover:text-cafe"
					>
						Cancelar
					</button>
				) : null}
			</form>

			<div className="overflow-hidden rounded-md border border-ink/[0.08]">
				<table className="w-full text-left text-[14.5px]">
					<thead className="bg-paper-alt text-[13px] font-semibold text-ink-soft">
						<tr>
							<th className="px-5 py-3">Nombre</th>
							<th className="px-5 py-3">Tipo</th>
							<th className="px-5 py-3 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{cargando ? (
							<tr>
								<td colSpan={3} className="px-5 py-6 text-center text-ink-faint">
									Cargando…
								</td>
							</tr>
						) : espacios.length === 0 ? (
							<tr>
								<td colSpan={3} className="px-5 py-6 text-center text-ink-faint">
									Todavía no hay espacios registrados.
								</td>
							</tr>
						) : (
							espacios.map((espacio) => (
								<tr key={espacio.id} className="border-t border-ink/[0.06] hover:bg-paper-alt">
									<td className="px-5 py-3">{espacio.nombre}</td>
									<td className="px-5 py-3 capitalize">{espacio.tipo}</td>
									<td className="px-5 py-3 text-right">
										<button
											onClick={() => empezarEdicion(espacio)}
											className="mr-4 text-[13.5px] font-semibold text-cafe hover:underline"
										>
											Editar
										</button>
										<button
											onClick={() => handleEliminar(espacio)}
											className="text-[13.5px] font-semibold text-error-text hover:underline"
										>
											Eliminar
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
