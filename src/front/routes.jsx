// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { OlvidePassword } from "./pages/OlvidePassword";
import { RestablecerPassword } from "./pages/RestablecerPassword";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Espacios } from "./pages/Espacios";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      <>
        {/* Landing pública en "/" — sister route, fuera del Layout genérico: tiene su propio nav/footer de marca. */}
        <Route path="/" element={<Landing />} errorElement={<h1>Not found!</h1>} />

        {/* Login — misma razón que Landing: chrome propio, no el Navbar/Footer boilerplate. */}
        <Route path="/login" element={<Login />} errorElement={<h1>Not found!</h1>} />
        <Route path="/olvide-password" element={<OlvidePassword />} errorElement={<h1>Not found!</h1>} />
        {/* Path exacto esperado por el link del correo -- ver src/api/auth.py::_enviar_email_reset */}
        <Route path="/restablecer-password" element={<RestablecerPassword />} errorElement={<h1>Not found!</h1>} />

        {/* App autenticada bajo /app: ProtectedRoute exige sesión antes de mostrar el Layout compartido. */}
        <Route path="/app" element={<ProtectedRoute />} errorElement={<h1>Not found!</h1>} >
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="single/:theId" element={<Single />} />  {/* Dynamic route for single items */}
            <Route path="demo" element={<Demo />} />
            <Route path="espacios" element={<Espacios />} />
          </Route>
        </Route>
      </>
    )
);