import { PageHeader } from "@/components/ui";
import { QuickAdd } from "@/components/quick-add";

export default function QuickAddPage() {
  return (
    <>
      <PageHeader
        title="Quick Add"
        subtitle="Type or dictate a note about someone you met. Review the extracted fields before saving."
      />
      <QuickAdd />
    </>
  );
}
