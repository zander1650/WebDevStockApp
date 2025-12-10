import Link from "next/link";

export default function a() {
  return (
    <div className="min-h-screen bg-blue-900">  
      <div className="flex flex-col items-center justify-center min-h-screen text-white px-6">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
          Home
        </h1>

        <h2 className="text-3xl md:text-4xl font-light mt-6 text-center max-w-3xl">
          Web Dev 2 Stock app 
        </h2>

        <div className="mt-12">
          <Link
            href="/StockApp"
            className="inline-block px-8 py-4 bg-black hover:bg-black-900 text-white text-xl font-bold rounded-xl shadow-xl transition transform hover:scale-105"
          >
            Search and add stocks to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}