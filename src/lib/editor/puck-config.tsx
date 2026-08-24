import type { Config } from "@measured/puck";
import { AboutSection } from "@/components/blocks/AboutSection";
import { BlogList } from "@/components/blocks/BlogList";
import { CategoryBar } from "@/components/blocks/CategoryBar";
import { ContactSection } from "@/components/blocks/ContactSection";
import { Footer } from "@/components/blocks/Footer";
import { Gallery } from "@/components/blocks/Gallery";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Navbar } from "@/components/blocks/Navbar";
import { ProductGrid } from "@/components/blocks/ProductGrid";
import type {
  AboutSectionData,
  BlogListData,
  CategoryBarData,
  ContactSectionData,
  FooterData,
  GalleryData,
  HeroBannerData,
  NavbarData,
  ProductGridData,
} from "@/lib/blocks/schemas";

type EditorProps = {
  Navbar: NavbarData;
  HeroBanner: HeroBannerData;
  CategoryBar: CategoryBarData;
  ProductGrid: ProductGridData;
  Gallery: GalleryData;
  AboutSection: AboutSectionData;
  ContactSection: ContactSectionData;
  Footer: FooterData;
  BlogList: BlogListData;
};

/**
 * Puck editor config (spec §5.7). Maps each block to a Puck component whose
 * fields edit exactly the block's structured data — users never touch raw code
 * (spec §1.4). The same block components render both here (edit mode) and on the
 * public site via TemplateRenderer.
 */
const linkFields = {
  label: { type: "text" as const },
  href: { type: "text" as const },
};

export const puckConfig: Config<EditorProps> = {
  components: {
    Navbar: {
      fields: {
        logoText: { type: "text" },
        links: {
          type: "array",
          arrayFields: linkFields,
          defaultItemProps: { label: "Link", href: "#" },
        },
      },
      defaultProps: { logoText: "Shop", links: [] },
      render: ({ logoText, links }) => (
        <Navbar logoText={logoText} links={links} />
      ),
    },
    HeroBanner: {
      fields: {
        heading: { type: "text" },
        subheading: { type: "text" },
        buttonText: { type: "text" },
        buttonHref: { type: "text" },
        bgColor: { type: "text" },
        imageUrl: { type: "text" },
      },
      defaultProps: { heading: "Heading", buttonHref: "#" },
      render: (props) => <HeroBanner {...props} />,
    },
    CategoryBar: {
      fields: {
        categories: {
          type: "array",
          arrayFields: linkFields,
          defaultItemProps: { label: "Category", href: "#" },
        },
      },
      defaultProps: { categories: [] },
      render: ({ categories }) => <CategoryBar categories={categories} />,
    },
    ProductGrid: {
      fields: {
        heading: { type: "text" },
        columns: {
          type: "select",
          options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
          ],
        },
        products: {
          type: "array",
          arrayFields: {
            name: { type: "text" },
            price: { type: "number" },
            imageUrl: { type: "text" },
            badge: { type: "text" },
          },
          defaultItemProps: { name: "Product", price: 0 },
        },
      },
      defaultProps: { columns: 3, products: [] },
      render: (props) => <ProductGrid {...props} />,
    },
    Gallery: {
      fields: {
        heading: { type: "text" },
        images: {
          type: "array",
          arrayFields: {
            url: { type: "text" },
            alt: { type: "text" },
          },
          defaultItemProps: { url: "", alt: "" },
        },
      },
      defaultProps: { images: [] },
      render: (props) => <Gallery {...props} />,
    },
    AboutSection: {
      fields: {
        heading: { type: "text" },
        body: { type: "textarea" },
        imageUrl: { type: "text" },
      },
      defaultProps: { heading: "About", body: "" },
      render: (props) => <AboutSection {...props} />,
    },
    ContactSection: {
      fields: {
        heading: { type: "text" },
        address: { type: "text" },
        phone: { type: "text" },
        email: { type: "text" },
      },
      defaultProps: { heading: "Contact" },
      render: (props) => <ContactSection {...props} />,
    },
    Footer: {
      fields: {
        text: { type: "text" },
        links: {
          type: "array",
          arrayFields: linkFields,
          defaultItemProps: { label: "Link", href: "#" },
        },
      },
      defaultProps: { text: "", links: [] },
      render: ({ text, links }) => <Footer text={text} links={links} />,
    },
    BlogList: {
      fields: {
        heading: { type: "text" },
        posts: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            excerpt: { type: "textarea" },
            date: { type: "text" },
            href: { type: "text" },
          },
          defaultItemProps: { title: "Post", href: "#" },
        },
      },
      defaultProps: { posts: [] },
      render: (props) => <BlogList {...props} />,
    },
  },
};
