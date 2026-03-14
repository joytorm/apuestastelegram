import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://apuestas.entrelanzados.es/sitemap.xml",
    host: "https://apuestas.entrelanzados.es",
  };
}
