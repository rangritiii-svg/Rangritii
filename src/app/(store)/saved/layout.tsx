import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Artists",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
