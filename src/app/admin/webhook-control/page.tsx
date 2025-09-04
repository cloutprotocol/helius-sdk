"use client";

import { useState } from "react";

export default function WebhookControlPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const toggleWebhook = async () => {
    try {
      const response = await fetch('/api/webhook/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isPaused ? 'resume' : 'pause',
          reason: pauseReason,
        }),
      });

      if (response.ok) {
        setIsPaused(!isPaused);
        setPauseReason("");
      } else {
        alert('Failed to update webhook status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating webhook status');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Webhook Control Panel</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Current Status</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isPaused 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isPaused ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            {isPaused ? 'PAUSED' : 'ACTIVE'}
          </div>
        </div>

        {!isPaused && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pause Reason (optional)
            </label>
            <input
              type="text"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="e.g., Debugging database issues"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={toggleWebhook}
          className={`px-4 py-2 rounded-md font-medium ${
            isPaused
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isPaused ? 'Resume Webhook' : 'Pause Webhook'}
        </button>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Pausing the webhook will cause it to return 200 OK but skip processing</li>
          <li>• Helius will continue sending webhooks, but they won't be stored</li>
          <li>• Use this for debugging without losing webhook data</li>
          <li>• Remember to resume when debugging is complete</li>
        </ul>
      </div>
    </div>
  );
}