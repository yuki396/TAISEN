import Link from "next/link"

export default function Home() {
  return (
    <div className="text-center">
      <section className="mb-16">
        <h1 className="text-4xl font-bold mb-6">TAISENへようこそ</h1>
        <p className="text-xl mb-8">あなたの対戦カードの予想を教えて</p>
        <div className="flex flex-col sm:flex-row justify-center mb-12">
          <Link
            href="/register/fighter"
            className="bg-black text-white px-8 py-4 rounded-md hover:bg-gray-800 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg font-semibold shadow-lg"
          >
            投票を行う
          </Link>
        </div>
      </section>
    </div>
  );
}
