```jsx
// Import necessary components and functions from react-router-dom.
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route
} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { OlvidePassword } from "./pages/OlvidePassword";
import { RestablecerPassword } from "./pages/RestablecerPassword";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Espacios } from "./pages/Espacios";
import { Agenda } from "./pages/Agenda";
import { NuevoServicio } from "./pages/NuevoServicio";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Landing pública en "/" — sister route, fuera del Layout genérico: tiene su propio nav/footer de marca. */}
      <Route path="/" element={<Landing />} errorElement={<h1>Not found!</h1>} />

      {/* Login — misma razón que Landing: chrome propio, no el Navbar/Footer boilerplate. */}
      <Route path="/login" element={<Login />} errorElement={<h1>Not found!</h1>} />

      <Route
        path="/olvide-password"
        element={<OlvidePassword />}
        errorElement={<h1>Not found!</h1>}
      />

      {/* Path exacto esperado por el link del correo -- ver src/api/auth.py::_enviar_email_reset */}
      <Route
        path="/restablecer-password"
        element={<RestablecerPassword />}
        errorElement={<h1>Not found!</h1>}
      />

      {/* App autenticada bajo /app: ProtectedRoute exige sesión antes de mostrar el Layout compartido. */}
      <Route
        path="/app"
        element={<ProtectedRoute />}
        errorElement={<h1>Not found!</h1>}
      >
        <Route element={<Layout />}>
          {/* Sin Dashboard real todavía -- redirige a Agenda. */}
          <Route index element={<Navigate to="/app/agenda" replace />} />

          <Route path="single/:theId" element={<Single />} />
          <Route path="demo" element={<Demo />} />
          <Route path="espacios" element={<Espacios />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="nuevo-servicio" element={<NuevoServicio />} />
        </Route>
      </Route>
    </>
  )
);
```;
