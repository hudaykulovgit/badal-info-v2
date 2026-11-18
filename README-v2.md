# BADAL v2 (прототип из ClickUp)

Две папки — положите обе в корень репозитория `badal-infodoska`:

- `v2/` — готовая сборка: `index.html`, `app.js`, `app.css`. Её отдаёт server.js по адресу `/v2`. Ничего собирать не нужно.
- `v2-src/` — исходный код (React + Vite): `src/App.jsx`, `src/Login.jsx`, `src/pages/*`, `src/components/ui/*` (shadcn), `src/data/rows.json`, `theme.css`.

## Как пересобрать из исходников

```bash
cd v2-src
npm install
npm run dev      # локально, http://localhost:5173/v2/
npm run build    # результат в v2-src/dist → скопировать содержимое в ../v2
```

Стили в `src/styles.css` уже скомпилированы из сборки ClickUp (Tailwind v4 + theme.css). Новые CSS-классы в коде не появятся сами — для этого нужно подключить Tailwind v4 (`@tailwindcss/vite`).

Данные демонстрационные (файлы «форма бюджет сўрови 16.09.2026», 1-илова). Ключ и пароль не запрашиваются: вход — только выбор роли.
