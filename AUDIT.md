# AUDIT.md — аудит проекта minifigma (29.09.2026)

Область осмотра: корневые HTML/SVG-макеты, приложение `mini-figma/` (React 19 + TS + Vite + Tailwind 4), git-состояние, воркфлоу, поиск секретов.

Важное наблюдение: в рабочей копии ~693 строк незакоммиченных изменений редактора (порядок слоёв, выравнивание, marquee, редактирование текста и др.) и нераспределённый `mini-figma/.github/` — вся разработка v2 существует только на диске, риск потери работы.

## Таблица проблем

| # | Проблема | Файл:строка | Серьёзность | Что делать |
|---|----------|-------------|-------------|------------|
| 1 | Рабочая копия содержит ~693 строки незакоммиченной разработки (редактор v2) и неотслеживаемый `.github/` — риск безвозвратной потери работы | `mini-figma/src/**` (git status) | **P1** | Зафиксировать снимок текущей разработки отдельным коммитом в ветке refactor |
| 2 | Несовпадение `base: '/mini-figma/'` с именем репозитория `minifigma` → при деплое на GitHub Pages ассеты будут отдавать 404 (workflow деплоит из `main`) | `mini-figma/vite.config.ts:7`, `mini-figma/.github/workflows/deploy.yml` | **P1** | Исправить base на `/minifigma/` |
| 3 | Слабая валидация загрузки из localStorage: объект пропускается, если есть только `id`; битый `x/y/width/height/type` приводит к NaN в разметке и сломанному холсту | `mini-figma/src/hooks/useShapes.ts:13-26` | **P1** | Фильтровать фигуры без корректных числовых координат и известного типа |
| 4 | Мёртвая/сломанная логикаearly-return: второй `return` внутри блока делает ветку Escape недостижимой; условие с `['Escape'].includes` не имеет смысла | `mini-figma/src/hooks/useHotkeys.ts:19-23` | **P2** | Упростить до безусловного `return` (поведение не меняется) |
| 5 | Мёртвый API: `addShape` не вызывается нигде; `duplicateSelected` — лишь псевдоним `copySelected` (дублирования не делает, вводит в заблуждение) | `mini-figma/src/hooks/useShapes.ts:102-110, 175-177` | **P2** | Удалить |
| 6 | Мёртвая утилита `deltaBetween` | `mini-figma/src/utils/geometry.ts:19-27` | **P2** | Удалить |
| 7 | `useEffect` обработки Ctrl+zoom без массива зависимостей — слушатель window переустанавливается на каждый рендер (при перетаскивании — на каждый pointermove) | `mini-figma/src/components/Canvas.tsx:184-202` | **P2** | Добавить массив зависимостей |
| 8 | NumInput для ширины/высоты принимает 0 и отрицательные: фигура исчезает с холста, остаётся в слоях; для radius/strokeWidth ограничение уже есть — непоследовательно | `mini-figma/src/components/PropertiesPanel.tsx:47-52` | **P2** | Ограничить min=1 как для radius/strokeWidth |
| 9 | `lang="en"` при русскоязычном контенте/интерфейсе | `mini-figma/index.html:2` | **P2** | Заменить на `ru` |
| 10 | Wheel-хак: мутация `nativeEvent` через `Object.defineProperty` и `preventDefault` внутри React-обработчика (React вешает wheel пассивно) — работает, т.к. у body скрыта прокрутка, но хрупко | `mini-figma/src/components/Canvas.tsx:231-239` | **P2** | Не трогаем (риск сломать зум); зафиксировано как технический долг — можно заменить нативным не-пассивным listener |
| 11 | Дубли PNG `preview/*.png` и `screens/*.png` — содержимым различаются (проверено hash: разные), не идентичны | `preview/`, `screens/` | P2 (не дубли) | Действий не требуется |
| 12 | Корневые файлы: `index.html` (личная страница), 2 HTML-макета Habit Tracker, 7 SVG-экранов — чистые, консистентны, скриптов с багами нет | — | OK | — |
| 13 | Секреты (токены/ключи/пароли) — не обнаружены в коде и git-истории; `id-token: write` в deploy.yml — право GitHub Actions, не секрет | — | OK | — |

## План-fix (P0 → P1 → P2)

P0: нет.

P1:
1. Зафиксировать снимок незакоммиченной работы (`AGENTS.md`, `AUDIT.md`, редактор v2, `.github/`) — на ветке refactor, main остаётся нетронутым.
2. `vite.config.ts`: base → `/minifigma/`.

Затем P2 по одному исправлению на коммит со сборкой после каждого:
3. Валидация `loadShapes` (useShapes).
4. Упрощение раннего return в `useHotkeys`.
5. Удаление мёртвого кода (`addShape`, `duplicateSelected`, `deltaBetween`).
6. Зависимости `useEffect` в Canvas.
7. Мин-размеры в PropertiesPanel.
8. `lang="ru"` в index.html.

## Что исправлено (29.09.2026)

Все правки выполнены в ветке `refactor/audit-fixes` (main не изменён, без push):

- Зафиксирован снимок незакоммиченной разработки редактора и workflow (проблема 1).
- `vite.config.ts`: base `/mini-figma/` → `/minifigma/` (проблема 2).
- `useShapes.ts`: полная валидация загружаемых фигур (id, тип, числовые x/y/width/height) (проблема 3).
- `useHotkeys.ts`: удалена недостижимая ветка Escape (проблема 4).
- Удалён мёртвый код: `addShape`, `duplicateSelected`, `deltaBetween` (проблемы 5-6).
- `Canvas.tsx`: добавлены зависимости `useEffect` хоткеев зума (проблема 7).
- `PropertiesPanel.tsx`: ширина/высота ограничены min=1 (проблема 8).
- `mini-figma/index.html`: `lang="ru"` (проблема 9).

Осталось (принято осознанно): wheel-хак в Canvas.tsx (проблема 10, технический долг риском для зума).

Проверка после каждой правки: `npm run build` (tsc -b + vite), `npm run lint` (oxlint, 0 ошибок); node v24.

