// Shaoor.org — Auth.js Route Handler
// This single file handles all Auth.js routes:
//   GET/POST /api/auth/signin
//   GET/POST /api/auth/callback/:provider
//   GET/POST /api/auth/signout
//   GET      /api/auth/session
//   GET      /api/auth/csrf

import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
