import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-7xl font-semibold text-rani-200">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900">
        Yeh page nahi mila
      </h1>
      <p className="mt-2 max-w-md text-ink-500">
        The page you are looking for does not exist or has moved. Chaliye, kuch sundar
        dekhte hain instead.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
      >
        Back to Home
      </Link>
    </div>
  );
}
