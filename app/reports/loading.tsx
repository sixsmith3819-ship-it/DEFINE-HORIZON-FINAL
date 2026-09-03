export default function ReportsLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-5" />
            <div className="flex gap-4">
              <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
