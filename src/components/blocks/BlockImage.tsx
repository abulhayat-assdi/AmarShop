/**
 * Image for block/tenant content.
 *
 * Tenant content images come from arbitrary URLs (self-hosted uploads or
 * external), so we use a plain <img> rather than next/image to avoid per-domain
 * remotePatterns config. The lint rule is disabled here in one place instead of
 * across every block.
 */
type BlockImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function BlockImage({ src, alt = "", className }: BlockImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
