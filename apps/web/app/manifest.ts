import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YKH-KDP · Yerel Kalkınma Hamlesi karar destek",
    short_name: "YKH",
    description: "Yatırım konusu önerileri, plan belgelerine birebir alıntıyla puanlanır ve ajans onayından geçer.",
    start_url: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#f3f4f2",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
