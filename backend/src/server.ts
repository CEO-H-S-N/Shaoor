// Shaoor.org — Local Development Server
// For local dev only. In production, Lambda handles this.

import { app } from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 Shaoor.org Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
});
