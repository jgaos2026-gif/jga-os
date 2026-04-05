# JGA-OS

## To-Do List Application

A simple, self-contained to-do list app that runs entirely in the browser — no build step, no dependencies.

### Project Structure

```
index.html   — App shell (HTML markup)
styles.css   — Styling
app.js       — Application logic & localStorage persistence
```

### Running Locally

**Option 1 — Open directly**

Just double-click `index.html` (or drag it into a browser tab). That's it.

**Option 2 — Serve with a local HTTP server** (avoids any `file://` quirks)

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

```bash
# Node.js (npx)
npx serve .
```

### Features

- Add a to-do item (non-empty, whitespace-trimmed).
- Mark an item as complete / incomplete.
- Delete an individual item.
- Filter view: **All** / **Active** / **Completed**.
- Clear all completed items at once.
- **localStorage** persistence — todos survive page refresh and browser restart.
- Keyboard-friendly: `Tab` through all controls; `Enter` to submit; `Delete`/`Backspace` key removes a focused list item.
- Screen-reader accessible (`role`, `aria-label`, `aria-live`, `aria-pressed`).

### localStorage Key

```
jga-os.todos.v1
```

Each todo is stored as a JSON object:

```json
{ "id": "...", "text": "Buy milk", "completed": false, "createdAt": "2026-04-05T00:00:00.000Z" }
```

---

## Constitution

- [Outline the constitution or fundamental principles of your project here]

## Additional Information

- For any issues or further assistance, please refer to the [documentation](LINK_TO_DOCUMENTATION) or contact the repository owner.