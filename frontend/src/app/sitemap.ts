import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://apuestas.entrelanzados.es/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
