export const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        {/* Bundle Skeleton */}
        <div className="bg-gray-200 rounded-lg h-32 w-full mb-4"></div>
        
        {/* Letter Skeletons */}
        <div className="space-y-2">
          <div className="bg-gray-200 rounded h-24 w-full"></div>
          <div className="bg-gray-200 rounded h-24 w-3/4"></div>
          <div className="bg-gray-200 rounded h-24 w-3/4"></div>
        </div>
        
        {/* Action Skeleton */}
        <div className="bg-gray-200 rounded h-10 w-32"></div>
      </div>
    </div>
  )
}