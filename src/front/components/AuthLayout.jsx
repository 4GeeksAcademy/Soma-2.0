import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// Estilos y armazón compartidos por las pantallas de auth (Login, OlvidePassword,
// RestablecerPassword) para no repetir las mismas clases tres veces.

export const inputClass =
	"w-full rounded-sm border-[1.5px] border-beige bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-cafe focus:ring-4 focus:ring-cafe/[0.14]";
export const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink-soft";

export const ErrorBanner = ({ mensaje }) =>
	mensaje ? <div className="mb-5 rounded-sm bg-error-bg px-4 py-3 text-[13.5px] text-error-text">{mensaje}</div> : null;

ErrorBanner.propTypes = {
	mensaje: PropTypes.string
};

export const SuccessBanner = ({ mensaje }) =>
	mensaje ? (
		<div className="mb-5 rounded-sm bg-success-bg px-4 py-3 text-[13.5px] text-success-text">{mensaje}</div>
	) : null;

SuccessBanner.propTypes = {
	mensaje: PropTypes.string
};

export const AuthLayout = ({ children }) => (
	<div className="flex min-h-screen items-center justify-center bg-paper-alt px-6">
		<div className="w-full max-w-[400px] rounded-lg border border-ink/[0.08] bg-paper p-10 shadow-card">
			<Link to="/" className="mb-8 block text-center font-display text-xl font-semibold text-ink">
				Soma
			</Link>
			{children}
			<Link to="/" className="mt-6 block text-center text-[13px] text-ink-faint hover:text-cafe">
				← Volver al inicio
			</Link>
		</div>
	</div>
);

AuthLayout.propTypes = {
	children: PropTypes.node.isRequired
};
