"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createContact, updateContact } from "@/app/actions/contacts";
import { RELATIONSHIP_TYPES, LINKEDIN_STATUSES } from "@/lib/constants";
import type { Contact, Tag } from "@/lib/types";
import { useState } from "react";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  preferred_name: z.string().optional(),
  role_title: z.string().optional(),
  company: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  relationship_type: z.string().min(1, "Required"),
  source: z.string().optional(),
  how_i_know_them: z.string().min(1, "Tell yourself how you know them"),
  relationship_context: z.string().optional(),
  linkedin_status: z.string(),
  importance_score: z.coerce.number<number>().min(1).max(5),
  closeness_score: z.coerce.number<number>().min(1).max(5),
  birthday_day: z.coerce.number<number>().min(1).max(31).optional().or(z.nan()),
  birthday_month: z.coerce.number<number>().min(1).max(12).optional().or(z.nan()),
  birthday_year: z.coerce.number<number>().min(1900).max(2100).optional().or(z.nan()),
  follow_up_interval_days: z.coerce.number<number>().min(1).max(3650),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ContactForm({
  contact,
  existingTags,
  initialValues,
}: {
  contact?: Contact;
  existingTags?: Tag[];
  initialValues?: Partial<FormValues>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: contact
      ? {
          full_name: contact.full_name,
          preferred_name: contact.preferred_name ?? "",
          role_title: contact.role_title ?? "",
          company: contact.company ?? "",
          city: contact.city ?? "",
          country: contact.country ?? "",
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          whatsapp_phone: contact.whatsapp_phone ?? "",
          linkedin_url: contact.linkedin_url ?? "",
          relationship_type: contact.relationship_type,
          source: contact.source ?? "",
          how_i_know_them: contact.how_i_know_them ?? "",
          relationship_context: contact.relationship_context ?? "",
          linkedin_status: contact.linkedin_status ?? "unknown",
          importance_score: contact.importance_score ?? 3,
          closeness_score: contact.closeness_score ?? 2,
          birthday_day: contact.birthday_day ?? NaN,
          birthday_month: contact.birthday_month ?? NaN,
          birthday_year: contact.birthday_year ?? NaN,
          follow_up_interval_days: contact.follow_up_interval_days ?? 90,
          notes: contact.notes ?? "",
          tags: (existingTags ?? []).map((t) => t.name).join(", "),
        }
      : {
          relationship_type: "professional",
          linkedin_status: "unknown",
          importance_score: 3,
          closeness_score: 2,
          follow_up_interval_days: 90,
          ...initialValues,
        },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload = {
      ...values,
      email: values.email || null,
      linkedin_url: values.linkedin_url || null,
      birthday_day: Number.isNaN(values.birthday_day) ? null : values.birthday_day,
      birthday_month: Number.isNaN(values.birthday_month) ? null : values.birthday_month,
      birthday_year: Number.isNaN(values.birthday_year) ? null : values.birthday_year,
      tags: (values.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const result = contact
      ? await updateContact(contact.id, payload)
      : await createContact(payload);

    setSubmitting(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(contact ? "Contact updated" : "Contact added");
    router.push(`/contacts/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Essentials */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Essentials</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Full name *</label>
            <input className="input" {...register("full_name")} placeholder="Karan Mehta" />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="label">Preferred name</label>
            <input className="input" {...register("preferred_name")} placeholder="Karan" />
          </div>
          <div>
            <label className="label">Relationship type *</label>
            <select className="input" {...register("relationship_type")}>
              {RELATIONSHIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">How I know them *</label>
            <input
              className="input"
              {...register("how_i_know_them")}
              placeholder="Met at React meetup through Priya"
            />
            {errors.how_i_know_them && (
              <p className="mt-1 text-xs text-red-600">{errors.how_i_know_them.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Work & location */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Work & location</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Role / title</label>
            <input className="input" {...register("role_title")} placeholder="Senior SWE" />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" {...register("company")} placeholder="Razorpay" />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" {...register("city")} placeholder="Bangalore" />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" {...register("country")} placeholder="India" />
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Contact channels</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register("phone")} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">WhatsApp phone</label>
            <input
              className="input"
              {...register("whatsapp_phone")}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input
              className="input"
              {...register("linkedin_url")}
              placeholder="https://linkedin.com/in/..."
            />
            {errors.linkedin_url && (
              <p className="mt-1 text-xs text-red-600">{errors.linkedin_url.message}</p>
            )}
          </div>
          <div>
            <label className="label">LinkedIn status</label>
            <select className="input" {...register("linkedin_status")}>
              {LINKEDIN_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <input className="input" {...register("source")} placeholder="LinkedIn, conference..." />
          </div>
        </div>
      </section>

      {/* Relationship */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Relationship</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Importance (1–5)</label>
            <select className="input" {...register("importance_score")}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}{n === 5 ? " — highest" : n === 1 ? " — lowest" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Closeness (1–5)</label>
            <select className="input" {...register("closeness_score")}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Follow-up interval (days)</label>
            <input
              className="input"
              type="number"
              {...register("follow_up_interval_days")}
            />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" {...register("tags")} placeholder="SWE, founder, conference" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Relationship context</label>
            <textarea
              className="input"
              rows={2}
              {...register("relationship_context")}
              placeholder="e.g. interested in infra roles, working on a fintech startup"
            />
          </div>
        </div>
      </section>

      {/* Birthday */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Birthday</h2>
        <p className="mb-4 text-xs text-slate-500">Year is optional.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Day</label>
            <input className="input" type="number" min={1} max={31} {...register("birthday_day")} />
          </div>
          <div>
            <label className="label">Month</label>
            <select className="input" {...register("birthday_month")}>
              <option value={NaN}>—</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input className="input" type="number" min={1900} max={2100} {...register("birthday_year")} />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="card p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Notes</h2>
        <textarea
          className="input"
          rows={4}
          {...register("notes")}
          placeholder="Anything worth remembering..."
        />
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary flex-1 md:flex-none">
          {submitting ? "Saving..." : contact ? "Save changes" : "Add contact"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
