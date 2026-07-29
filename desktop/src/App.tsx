import { useState } from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          GigDesk Desktop
        </h1>
        <p className="text-gray-600 mb-8">
          Manage your invoices from your desktop
        </p>
        <button className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
          Open Dashboard
        </button>
      </div>
    </div>
  );
}

export default App;
