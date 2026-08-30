import { app } from "./app.ts";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`IronBoard backend running on http://localhost:${PORT}`);
});
