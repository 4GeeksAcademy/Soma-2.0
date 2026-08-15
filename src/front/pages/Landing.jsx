import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// Copy y estructura definidos junto con Jorge — ver docs/identidad-visual.md.
// Storytelling: "un día en Soma" en vez de una lista de features (sizzle, no steak).

const antesDespues = {
	antes: [
		"La cita se confirma por WhatsApp y se pierde en el chat.",
		"El expediente del paciente vive en una carpeta física.",
		"El consentimiento se firma en una hoja que alguien tiene que archivar.",
		'El inventario se descuenta "a ojo", hasta que un día falta el insumo.',
		"Las comisiones se calculan a mano, al final del mes, con margen de error."
	],
	despues: [
		"La cita se agenda una vez y todos ven la disponibilidad real.",
		"El expediente clínico se abre con un clic, historial incluido.",
		"El consentimiento se firma en la tablet, queda guardado con la cita.",
		"El inventario se descuenta solo, por receta fija de cada servicio.",
		"Las comisiones y la caja del día están listas cuando cierras."
	]
};

const timeline = [
	{
		time: "8:00 AM",
		title: "La agenda ya está lista",
		body: "Disponibilidad real por especialista y por espacio, sincronizada con Google Calendar. Nadie agenda dos citas en la misma sala sin darse cuenta.",
		rows: [
			{ k: "10:00", v: "Lucía F. — Manicure 3D" },
			{ k: "12:00", v: "Ana M. — Ritual facial 90’" },
			{ k: "15:30", v: "Diego R. — Depilación láser" }
		]
	},
	{
		time: "11:30 AM",
		title: "El expediente se abre con la paciente",
		body: "Historial, fotos y preferencias en un lugar. El consentimiento se firma en la tablet antes del procedimiento — sin hojas sueltas que se pierden.",
		rows: [
			{ k: "Paciente", v: "Ana Martínez" },
			{ k: "Consentimiento", badge: { tone: "success", text: "Firmado" } },
			{ k: "Alergias", v: "Ninguna registrada" }
		]
	},
	{
		time: "2:00 PM",
		title: "El inventario se descuenta solo",
		body: "Cada servicio tiene su receta de insumos — al aplicarlo, el stock baja automático. Soma avisa antes de que algo se agote de verdad.",
		rows: [
			{ k: "Ácido hialurónico", badge: { tone: "warning", text: "Stock bajo" } },
			{ k: "Cera depilatoria", v: "14 u." },
			{ k: "Guantes nitrilo", v: "3 cajas" }
		]
	},
	{
		time: "6:00 PM",
		title: "Cierras el día sabiendo, no adivinando",
		body: "Ocupación, ventas, comisiones por especialista y facturación — listos al momento de cerrar, sin abrir un Excel.",
		rows: [
			{ k: "Ocupación", v: "86%" },
			{ k: "Ventas del día", v: "$18,400.00" },
			{ k: "Comisiones", v: "$4,120.00" }
		]
	}
];

const confianza = [
	{
		fuerte: "Nada se pierde en un chat.",
		resto: "El consentimiento queda guardado con la cita, no en una hoja suelta que alguien tiene que archivar."
	},
	{
		fuerte: "Nadie ve lo que no le toca.",
		resto: "Recepción agenda; el expediente clínico lo abre quien atiende."
	},
	{
		fuerte: "Tu información sigue siendo tuya.",
		resto: "Se exporta cuando la necesites, sin depender de nadie más."
	}
];

const Badge = ({ tone, text }) => {
	const toneClasses = tone === "success" ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text";
	return (
		<span
			className={`inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClasses}`}
		>
			<span className="h-[5px] w-[5px] rounded-full bg-current" />
			{text}
		</span>
	);
};

Badge.propTypes = {
	tone: PropTypes.oneOf(["success", "warning"]).isRequired,
	text: PropTypes.string.isRequired
};

const rowShape = PropTypes.shape({
	k: PropTypes.string.isRequired,
	v: PropTypes.string,
	badge: PropTypes.shape({
		tone: PropTypes.oneOf(["success", "warning"]).isRequired,
		text: PropTypes.string.isRequired
	})
});

const MockCard = ({ rows }) => (
	<div className="w-full rounded-md border border-ink/[0.06] bg-paper px-[18px] py-4 shadow-card">
		{rows.map((row) => (
			<div
				key={row.k}
				className="flex items-center justify-between border-t border-ink/[0.06] py-2 text-[13px] first:border-t-0"
			>
				<span className="text-ink-faint">{row.k}</span>
				{row.badge ? (
					<Badge tone={row.badge.tone} text={row.badge.text} />
				) : (
					<span className="font-data tabular-nums">{row.v}</span>
				)}
			</div>
		))}
	</div>
);

MockCard.propTypes = {
	rows: PropTypes.arrayOf(rowShape).isRequired
};

export const Landing = () => {
	return (
		<div>
			<nav className="sticky top-0 z-50 border-b border-ink/[0.07] bg-paper/85 backdrop-blur-[14px] backdrop-saturate-150">
				<div className="mx-auto flex max-w-[1160px] items-center justify-between gap-5 px-8 py-[18px] sm:px-5 sm:py-4">
					<div className="font-display text-xl font-semibold -tracking-[0.01em]">Soma</div>
					<div className="flex items-center gap-1.5">
						<a
							href="#dia"
							className="hidden rounded-full px-3.5 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:bg-nude hover:text-ink sm:inline-block"
						>
							Cómo funciona
						</a>
						<a
							href="#confianza"
							className="hidden rounded-full px-3.5 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:bg-nude hover:text-ink sm:inline-block"
						>
							Confianza
						</a>
						<Link
							to="/login"
							className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-bold text-paper hover:bg-cafe"
						>
							Iniciar sesión
						</Link>
					</div>
				</div>
			</nav>

			<header className="py-16 pb-10">
				<div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-10 px-8 sm:px-5 md:grid-cols-2 md:gap-14">
					<div>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-nude py-[7px] pl-2.5 pr-3.5 text-[13px] font-semibold text-cafe">
							<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cafe" />
							Todo en tu cabeza. Nada en un solo lugar.
						</div>
						<h1 className="mb-[22px] text-[50px] leading-[1.06] -tracking-[0.015em]">
							Todo lo que hace tu clínica,
							<br />
							en <em className="italic font-normal text-cafe">un solo lugar tranquilo.</em>
						</h1>
						<p className="mb-8 max-w-[46ch] text-lg text-ink-soft">
							Agenda, expedientes, inventario y cobros — conectados, para que dejes de perseguir papeles y vuelvas a lo
							que sabes hacer: cuidar pacientes.
						</p>
						<div className="flex flex-wrap items-center gap-4">
							<a
								href="#antes-despues"
								className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-beige px-6 py-3.5 text-[15px] font-bold text-ink hover:border-cafe hover:text-cafe"
							>
								Ver cómo funciona
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
									<path d="M12 5v14M6 13l6 6 6-6" />
								</svg>
							</a>
							<span className="text-[13px] text-ink-faint">Sin instalar nada. Explora antes de decidir.</span>
						</div>
					</div>

					<div className="landing-hero-photo relative aspect-[4/5] overflow-hidden rounded-xl shadow-glass">
						<div className="absolute left-5 right-5 top-5 z-[2] flex flex-wrap gap-2">
							<span className="glass-ink inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-xs font-semibold">
								Ritual facial 90&#8217;
							</span>
							<span className="glass-ink inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-xs font-semibold">
								Sala 2
							</span>
						</div>
						<div className="glass-light absolute bottom-4 left-4 right-4 z-[2] rounded-lg p-[18px] shadow-glass">
							<div className="mb-[5px] text-[11px] font-bold uppercase tracking-[0.12em] text-cafe">Hoy · 18:00</div>
							<h4 className="mb-2.5 text-[19px]">Cierre del día</h4>
							<div className="flex items-center justify-between">
								<span className="text-xs text-ink-soft">Ocupación de hoy</span>
								<span className="font-data text-[13px] tabular-nums">86%</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-ink-soft">Comisiones a repartir</span>
								<span className="font-data text-[13px] tabular-nums">$4,120.00</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main>
				<section id="antes-despues" className="py-24">
					<div className="mx-auto max-w-[1160px] px-8 sm:px-5">
						<div className="mb-[52px] max-w-[620px]">
							<div className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cafe">El problema real</div>
							<h2 className="mb-3.5 text-[34px] -tracking-[0.01em]">
								El caos no se ve en la sala de espera. Se ve al cerrar.
							</h2>
							<p className="max-w-[58ch] text-base text-ink-soft">
								Tres agendas distintas, un cuaderno de inventario y un Excel de comisiones que nadie actualiza a tiempo
								— es el precio invisible de crecer sin un sistema.
							</p>
						</div>

						<div className="grid grid-cols-1 overflow-hidden rounded-xl shadow-card md:grid-cols-2">
							<div className="bg-[#EDEAE4] px-10 py-11 saturate-[.55]">
								<span className="mb-5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8A8478]">
									Hoy, sin Soma
								</span>
								<ul className="grid gap-3.5">
									{antesDespues.antes.map((item) => (
										<li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5] text-[#6B665C]">
											<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A8A296]" />
											{item}
										</li>
									))}
								</ul>
							</div>
							<div className="bg-paper-alt px-10 py-11">
								<span className="mb-5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-cafe">
									Con Soma
								</span>
								<ul className="grid gap-3.5">
									{antesDespues.despues.map((item) => (
										<li key={item} className="flex items-start gap-3 text-[15px] font-medium leading-[1.5] text-ink">
											<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cafe" />
											{item}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>

				<section id="dia" className="py-24">
					<div className="mx-auto max-w-[1160px] px-8 sm:px-5">
						<div className="mb-[52px] max-w-[620px]">
							<div className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cafe">Cómo funciona</div>
							<h2 className="mb-3.5 text-[34px] -tracking-[0.01em]">Un día en Soma</h2>
							<p className="max-w-[58ch] text-base text-ink-soft">
								No es una lista de funciones — es lo que pasa, en orden, desde que abres hasta que cierras caja.
							</p>
						</div>

						<div className="flex flex-col">
							{timeline.map((step) => (
								<div
									key={step.time}
									className="grid grid-cols-1 gap-4 border-t border-ink/[0.08] py-10 first:border-t-0 md:grid-cols-[140px_1fr] md:gap-10"
								>
									<div className="font-data pt-0.5 text-sm font-semibold text-cafe">{step.time}</div>
									<div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[1.1fr_0.9fr]">
										<div>
											<h3 className="mb-2.5 text-[22px]">{step.title}</h3>
											<p className="max-w-[48ch] text-[15px] text-ink-soft">{step.body}</p>
										</div>
										<div className="flex min-h-[150px] items-center justify-center rounded-lg bg-paper-alt p-5">
											<MockCard rows={step.rows} />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="confianza" className="py-24">
					<div className="mx-auto max-w-[1160px] px-8 sm:px-5">
						<div className="mb-[52px] max-w-[620px]">
							<div className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cafe">
								Lo que maneja tu clínica, protegido
							</div>
							<h2 className="mb-3.5 text-[34px] -tracking-[0.01em]">
								Tus pacientes te confían su información.
								<br />
								Soma la cuida igual.
							</h2>
							<p className="max-w-[58ch] text-base text-ink-soft">
								Expedientes clínicos y consentimientos firmados no son un formulario más — son la parte más sensible de
								tu negocio. Cada uno queda con fecha, hora, y visible solo para quien debe verlo.
							</p>
						</div>

						<div className="grid grid-cols-1 items-center gap-11 md:grid-cols-[0.9fr_1.1fr]">
							<div className="flex min-h-[150px] items-center justify-center rounded-lg bg-paper-alt p-5">
								<MockCard
									rows={[
										{ k: "Paciente", v: "Ana Martínez" },
										{ k: "Consentimiento", badge: { tone: "success", text: "Firmado · 11:32 AM" } },
										{ k: "Visible para", v: "Especialista, Admin." }
									]}
								/>
							</div>
							<ul className="grid gap-5">
								{confianza.map((item) => (
									<li key={item.fuerte} className="relative pl-[22px] text-[15px] leading-[1.6] text-ink-soft">
										<span className="absolute left-0 top-2 h-[7px] w-[7px] rounded-full bg-cafe" />
										<strong className="font-bold text-ink">{item.fuerte}</strong> {item.resto}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			</main>

			<div className="py-[110px] text-center">
				<div className="mx-auto max-w-[640px] px-8 sm:px-5">
					<h2 className="mb-5 text-[40px] -tracking-[0.01em]">
						Tu clínica ya sabe cuidar pacientes.
						<br />
						Que Soma cuide lo demás.
					</h2>
					<p className="mb-9 text-[17px] text-ink-soft">
						Explora el producto, a tu ritmo — sin llamadas de ventas ni formularios.
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<a
							href="#dia"
							className="inline-flex items-center rounded-full bg-ink px-[30px] py-[15px] text-[15px] font-bold text-paper hover:bg-cafe"
						>
							Ver cómo funciona
						</a>
						<Link
							to="/login"
							className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-beige px-6 py-3.5 text-[15px] font-bold text-ink hover:border-cafe hover:text-cafe"
						>
							Iniciar sesión
						</Link>
					</div>
				</div>
			</div>

			<footer className="border-t border-ink/[0.08] py-11">
				<div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-8 sm:px-5">
					<div className="font-display text-lg font-semibold">Soma</div>
					<div className="text-[13px] text-ink-faint">Gestión para clínicas y spas de estética</div>
				</div>
			</footer>
		</div>
	);
};
