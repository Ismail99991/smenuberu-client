import Link from "next/link";

export default function OnboardingWelcome() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950 text-center space-y-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Добро пожаловать
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          в сервис поиска исполнителей с быстрой оплатой
        </p>
        <Link
          href="/onboarding/workers"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Далее
        </Link>
      </div>
    </div>
  );
}
