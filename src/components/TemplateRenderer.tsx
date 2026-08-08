import { type Block, parseBlocks } from "@/lib/blocks/schemas";
import { AboutSection } from "./blocks/AboutSection";
import { BlogList } from "./blocks/BlogList";
import { CategoryBar } from "./blocks/CategoryBar";
import { ContactSection } from "./blocks/ContactSection";
import { Footer } from "./blocks/Footer";
import { Gallery } from "./blocks/Gallery";
import { HeroBanner } from "./blocks/HeroBanner";
import { Navbar } from "./blocks/Navbar";
import { ProductGrid } from "./blocks/ProductGrid";

/**
 * TemplateRenderer (spec §5.4).
 *
 * Reads a `blocks` array (from a template or a tenant's site_config) and renders
 * each block by mapping its `type` to a block component. The same renderer draws
 * every tenant's site. Input is parsed/validated first (parseBlocks), so unknown
 * or malformed blocks are dropped rather than breaking the page — users never
 * inject raw markup (spec §1.4).
 */
function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "Navbar":
      return <Navbar key={key} {...block.data} />;
    case "HeroBanner":
      return <HeroBanner key={key} {...block.data} />;
    case "CategoryBar":
      return <CategoryBar key={key} {...block.data} />;
    case "ProductGrid":
      return <ProductGrid key={key} {...block.data} />;
    case "Gallery":
      return <Gallery key={key} {...block.data} />;
    case "AboutSection":
      return <AboutSection key={key} {...block.data} />;
    case "ContactSection":
      return <ContactSection key={key} {...block.data} />;
    case "BlogList":
      return <BlogList key={key} {...block.data} />;
    case "Footer":
      return <Footer key={key} {...block.data} />;
  }
}

export function TemplateRenderer({ blocks }: { blocks: unknown }) {
  const parsed = parseBlocks(blocks);
  return <>{parsed.map((block, i) => renderBlock(block, i))}</>;
}
