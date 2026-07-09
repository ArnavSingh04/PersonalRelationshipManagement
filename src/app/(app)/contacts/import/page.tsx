import { PageHeader } from "@/components/ui";
import { CsvImport } from "@/components/csv-import";

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import contacts"
        subtitle="Upload a CSV, preview the rows, resolve duplicates, then import."
      />
      <CsvImport />
    </>
  );
}
