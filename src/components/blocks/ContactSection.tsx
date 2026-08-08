import type { ContactSectionData } from "@/lib/blocks/schemas";

export function ContactSection({
  heading,
  address,
  phone,
  email,
}: ContactSectionData) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12 text-center">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{heading}</h2>
      <ul className="flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-400">
        {address && <li>{address}</li>}
        {phone && (
          <li>
            <a href={`tel:${phone}`} className="hover:text-foreground">
              {phone}
            </a>
          </li>
        )}
        {email && (
          <li>
            <a href={`mailto:${email}`} className="hover:text-foreground">
              {email}
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}
