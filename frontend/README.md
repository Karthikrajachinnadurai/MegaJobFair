# Mega Job Fair — Frontend

React 18 + Vite. One app with five portals; the login decides which one opens.

| Role | Home | Screens |
|---|---|---|
| ADMIN | `/admin` | Dashboard (live), Companies (+ volunteer/HR logins), Students (search, add, reset login), Gate volunteers, Gate scanner |
| GATE_VOLUNTEER | `/gate` | QR scanner → attendance + login email |
| STUDENT | `/student` | Companies (register, live waiting counts), My registrations (company QRs, drop queue), Profile |
| COMPANY_VOLUNTEER | `/company` | Add to queue (scanner), Live queue |
| HR | `/hr` | Search by name → In-interview → Select / Reject, Live queue |

## Run

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8081 (backend port)
npm run dev               # http://localhost:5173
```

Port 5173 matches `FRONTEND_ORIGINS` and `FRONTEND_LOGIN_URL` in `backend/application.yml`.
Build for production with `npm run build` (output in `dist/`).

## Notes

- **Camera scanning needs HTTPS** on phones (browsers only allow the camera on HTTPS or localhost).
  On a LAN IP over plain HTTP, use the manual token box or serve over HTTPS.
  Add every deployed frontend URL to `FRONTEND_ORIGINS` on the backend.
- Queue/HR screens call Module 2 endpoints (`/api/queue/**`, `/api/hr/**`, `/api/student/queue/{id}/drop`), which are on the `feature/Deva` branch until merged.
- Live screens poll every 4–10 s and pause when the tab is hidden.
- All API calls are in `src/api/client.js`; styles and design tokens are in `src/styles.css`.

## Structure

```
src/
  api/client.js          fetch wrapper, JWT header, 401 → logout, all endpoints
  auth/                  AuthContext (session, login, logout), RequireRole
  components/            Layout, UI kit, Icon, QrScanner, usePolling, format helpers
  pages/admin|gate|student|company|hr
  App.jsx                routes per role
  styles.css             design system
```
