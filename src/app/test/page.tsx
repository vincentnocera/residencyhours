export default function TestPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind CSS Test Page</h1>
      
      {/* Basic color test */}
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        If you see this with a blue background, Tailwind is working!
      </div>
      
      {/* Gradient test */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
        Gradient test - purple to pink
      </div>
      
      {/* Flexbox and spacing test */}
      <div className="flex gap-4">
        <div className="bg-red-500 text-white p-4 rounded flex-1">Red Box</div>
        <div className="bg-yellow-500 text-black p-4 rounded flex-1">Yellow Box</div>
        <div className="bg-green-500 text-white p-4 rounded flex-1">Green Box</div>
      </div>
      
      {/* Button variants */}
      <div className="flex gap-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Blue Button
        </button>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Green Button
        </button>
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Gray Button
        </button>
      </div>
      
      {/* Grid test */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-500 text-white p-4 rounded">Grid 1</div>
        <div className="bg-indigo-600 text-white p-4 rounded">Grid 2</div>
        <div className="bg-indigo-700 text-white p-4 rounded">Grid 3</div>
      </div>
      
      {/* Responsive test */}
      <div className="bg-gray-200 p-4 rounded">
        <p className="text-sm md:text-base lg:text-lg">
          This text changes size on different screen sizes (sm/md/lg)
        </p>
      </div>
      
      {/* Shadow and border test */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Card with Shadow</h2>
        <p className="text-gray-600">This card has shadow-lg and a border</p>
      </div>
    </div>
  )
}