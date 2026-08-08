import type { HeroBannerData } from "@/lib/blocks/schemas";
import { BlockImage } from "./BlockImage";

export function HeroBanner({
  heading,
  subheading,
  buttonText,
  buttonHref,
  bgColor,
  imageUrl,
}: HeroBannerData) {
  return (
    <section
      className={`relative overflow-hidden px-6 py-20 text-center ${bgColor ? "text-white" : ""}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {imageUrl && (
        <BlockImage
          src={imageUrl}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {heading}
        </h1>
        {subheading && <p className="text-lg opacity-80">{subheading}</p>}
        {buttonText && (
          <a
            href={buttonHref}
            className="mt-2 rounded-md bg-foreground px-6 py-2.5 font-medium text-background"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
