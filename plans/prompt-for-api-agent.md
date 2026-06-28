## Bug: 400 Bad Request for sharp root notes in chord/scale API

### Problem
The frontend now sends properly URL-encoded requests for chords/scales with sharp root notes (e.g., `C#`), but the API returns `400 Bad Request`.

### Example request that fails
```
GET http://localhost:3000/api/chords/major/C%23
Status: 400 Bad Request
```

`C%23` is the correct URL encoding of `C#`. The backend needs to URL-decode this route parameter so it becomes `C#` when the route handler uses it.

### Routes affected
- `GET /api/chords/:type/:root` — e.g., `/api/chords/major/C%23`
- `GET /api/scales/:type/:root` — e.g., `/api/scales/major/C%23`

### Expected behavior
The server should decode `%23` to `#` in route params, so `req.params.root` returns `C#` (not `C%23` and not just `C`).

### Root cause analysis (for context)
The `#` character is a reserved URL fragment identifier. When the browser sees a raw `#` in a URL like `/api/chords/major/C#`, it strips everything after it and sends only `/api/chords/major/C`. The frontend fixed this by encoding `#` as `%23`, which is the correct approach per URL spec. Now the backend needs to handle the decoded character.

### Fix suggestion
In Express.js, route params are automatically decoded by default, so `C%23` should become `C#` via `req.params`. If this doesn't work, check:
1. Whether any middleware or error handler is rejecting requests with `#` in the URL
2. Whether the route pattern uses regex that excludes `#`
3. Whether there's URL param validation that rejects non-alphanumeric characters

If automatic decoding isn't working, manually decode in the handler:
```javascript
const rootNote = decodeURIComponent(req.params.root);
