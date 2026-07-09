import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";

export default function NewContactPage() {
  return (
    <>
      <PageHeader
        title="Add contact"
        subtitle="Only name, relationship type, and how you know them are required."
      />
      <ContactForm />
    </>
  );
}
