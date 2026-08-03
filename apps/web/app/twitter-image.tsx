/**
 * X (Twitter) kartı — Open Graph görselinin aynısı.
 *
 * X kendi `twitter:image` etiketini istiyor ama görselin farklı olması için
 * bir sebep yok: `summary_large_image` de 1200×630 kabul ediyor. Ayrı bir
 * dosya tutmak iki görselin zamanla ayrışması demek olurdu.
 */
export { alt, size, contentType, default } from "./opengraph-image.tsx";
