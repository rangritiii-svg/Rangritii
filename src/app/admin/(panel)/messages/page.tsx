import { Inbox, Mail, User } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getContactMessages } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-ink-900">
        <Inbox className="h-7 w-7 text-rani-700" /> Messages{" "}
        <span className="text-lg text-ink-500">({messages.length})</span>
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Customer messages sent from the Contact Us page appear here. Click the email
        link to reply.
      </p>

      {messages.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white py-16 text-center text-ink-500">
          No messages yet. Contact form submissions will appear here.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold text-ink-900">
                    <User className="h-4 w-4 text-rani-700" /> {m.name}
                  </p>
                  <a
                    href={`mailto:${m.email}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rani-700"
                  >
                    <Mail className="h-4 w-4" /> {m.email}
                  </a>
                </div>
                <p className="text-xs text-ink-500">{formatDate(m.createdAt)}</p>
              </div>
              <p className="mt-4 whitespace-pre-wrap border-t border-cream-200 pt-4 text-sm text-ink-700">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
