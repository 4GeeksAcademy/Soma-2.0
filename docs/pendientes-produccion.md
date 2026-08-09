# Pendientes para producción

Cosas que hay que resolver antes (o al momento) de desplegar a Render — encontradas mientras se construía identidad/Tailwind/login. No son features, son configuración que falta.

## Variables de entorno faltantes en `render.yaml`

Hoy solo están: `VITE_BASENAME`, `FLASK_APP`, `FLASK_DEBUG`, `FLASK_APP_KEY`, `PYTHON_VERSION`, `DATABASE_URL`. Faltan:

- [ ] `JWT_SECRET_KEY` — default en código es `'dev'` (`src/app.py`). Inseguro en prod.
- [ ] `FRONTEND_URL` — sin esto, el link del correo de "restablecer contraseña" apunta a `localhost:3000` también en producción (issue #24, PR #36).
- [ ] `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USE_TLS` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_DEFAULT_SENDER` — sin esto, el email de reset de password falla en silencio (`_enviar_email_reset` solo loguea el error, el usuario nunca sabe que no llegó).
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` / `GOOGLE_REFRESH_TOKEN` — issue #1 (OAuth2 Google Calendar).
- [ ] `FLASK_APP_KEY` tiene el valor placeholder `"any key works"` en `render.yaml` — cambiar por un secret real antes de deployar.

## Confirmar, no encontré problema pero vale la pena revisar

- [ ] Hay `requirements.txt` **y** `Pipfile`/`Pipfile.lock` — `render_build.sh` usa `pipenv install`. Confirmar que `requirements.txt` no está desactualizado / no se usa en ningún lado más (CI, docs de setup).
- [ ] `dist/` está versionado en git (no en `.gitignore`) — el build de Render lo regenera (`render_build.sh` corre `npm run build`), pero si alguien corre `npm run build` local y comitea el resultado por error, puede ensuciar PRs. Ya pasó en esta sesión (se revirtió a mano cada vez).

## Ya resuelto

- [x] `npm run lint` estaba completamente roto — reparado (PR #35).
- [x] `package-lock.json` sincronizado con las dependencias de Tailwind.
- [x] Migraciones sí corren en el build (`pipenv run upgrade` → `flask db upgrade`, confirmado en `Pipfile`).
