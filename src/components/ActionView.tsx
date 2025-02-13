import React, { useState } from 'react';
    import { TaskAction } from '../types/firestore-schema';
    import { taskService } from '../services/TaskService'; // Import TaskService
    import { Check, X } from 'lucide-react';

    interface ActionViewProps {
      action: TaskAction;
      onComplete: (actionId: string, data?: any) => void;
      onCancel: () => void;
      taskId: string; // Add taskId prop
    }

    export const ActionView: React.FC<ActionViewProps> = ({ action, onComplete, onCancel, taskId }) => {
      const [data, setData] = useState(action.data || null); // Local state for action data
      const [isUploading, setIsUploading] = useState(false); //for loading
      const [error, setError] = useState<string | null>(null);

      const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData(e.target.value);
      };

      const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData(e.target.value);
      };

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        try {
          const fileUrl = await taskService.uploadTaskAttachment(taskId, file); // Use taskId
          setData({ fileUrl }); // Store the URL
        } catch (err: any) {
          setError(err.message || 'Failed to upload file.');
        } finally {
          setIsUploading(false);
        }
      };

      const handleComplete = () => {
        onComplete(action.id, data);
      };

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{action.title}</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          <div>
            {action.type === 'text' && (
              <input
                type="text"
                placeholder="Enter text..."
                value={data || ''}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            )}
            {action.type === 'file_upload' && (
              <div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {data?.fileUrl && (
                  <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View File
                  </a>
                )}
                {isUploading && <span>Uploading...</span>}
              </div>
            )}
            {action.type === 'approval' && (
              <div>
                <p>Waiting for approval...</p>
                {/* Add approval UI here (e.g., for admins/managers) */}
              </div>
            )}
            {action.type === 'date' && (
              <input
                type="date"
                value={data || ''}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            )}
          </div>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Complete Action'}
            </button>
          </div>
        </div>
      );
    };
