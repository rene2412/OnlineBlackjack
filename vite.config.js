import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  server: {
    port: 5173,
    proxy: {
     "/api": {
  		target: "http://localhost:8080",
  		changeOrigin: false,
  		configure: (proxy) => {
    		proxy.on("proxyReq", (proxyReq, req) => {
      		const token = req.headers["x-session-token"];
      		if (token) proxyReq.setHeader("X-Session-Token", token);
    	     });
  	   },
	}, 
     "/ws": {
        target: "ws://localhost:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
