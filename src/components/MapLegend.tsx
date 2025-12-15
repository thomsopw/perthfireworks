export default function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
      <h3 className="text-xs font-semibold text-gray-700 mb-2">Event Status</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{
              backgroundColor: '#10b981',
              transform: 'rotate(-45deg)',
              borderRadius: '50% 50% 50% 0',
            }}
          />
          <span className="text-xs text-gray-700">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{
              backgroundColor: '#f59e0b',
              transform: 'rotate(-45deg)',
              borderRadius: '50% 50% 50% 0',
            }}
          />
          <span className="text-xs text-gray-700">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{
              backgroundColor: '#6b7280',
              transform: 'rotate(-45deg)',
              borderRadius: '50% 50% 50% 0',
            }}
          />
          <span className="text-xs text-gray-700">Past</span>
        </div>
      </div>
    </div>
  );
}

