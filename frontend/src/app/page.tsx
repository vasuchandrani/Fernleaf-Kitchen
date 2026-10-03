import Image from "next/image";

export default async function Home() {
  let backendMessage = "Not connected yet...";
  let isConnected = false;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/`, {
      cache: "no-store",
    });
    if (res.ok) {
      backendMessage = await res.text();
      isConnected = true;
    }
  } catch (error) {
    console.error("Backend connection failed:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fernleaf Kitchen
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Frontend and Backend Connection Test
        </p>

        <div className={`p-4 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`font-semibold ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isConnected ? "Connected to Backend" : "Connection Failed"}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-mono text-sm bg-black/5 dark:bg-white/5 p-2 rounded">
            Message: {backendMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
