import React, { useState } from 'react';
import { TaskAction } from '../../types/firestore-schema';
import { 
  Save, X, Plus, Trash2, FileText, Type, List, 
  Calendar, Image, Video, Mic, Info, GitBranch
} from 'lucide-react';

interface ActionEditorProps {
  action: TaskAction;
  allActions: TaskAction[];
  onSave: (updatedAction: TaskAction) => void;
  onCancel: () => void;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  allActions,
  onSave,
  onCancel
}) => {
  const [editedAction, setEditedAction] = useState<TaskAction>({...action});
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  
  // Filter out the current action and actions that would create circular dependencies
  const availableActions = allActions.filter(a => 
    a.id !== action.id && 
    // Don't show actions that depend on this action (would create circular dependency)
    !a.dependsOn?.includes(action.id)
  );
  
  const handleChange = (field: keyof TaskAction, value: any) => {
    setEditedAction(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleToggleDependency = (actionId: string) => {
    setEditedAction(prev => {
      const currentDeps = prev.dependsOn || [];
      const newDeps = currentDeps.includes(actionId)
        ? currentDeps.filter(id => id !== actionId)
        : [...currentDeps, actionId];
        
      return {
        ...prev,
        dependsOn: newDeps
      };
    });
  };
  
  const handleSave = () => {
    onSave(editedAction);
  };
  
  // Render fields based on action type
  const renderTypeSpecificFields = () => {
    switch (editedAction.type) {
      case 'info':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Info Title
              </label>
              <input
                type="text"
                value={editedAction.infoTitle || ''}
                onChange={(e) => handleChange('infoTitle', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Info Description
              </label>
              <textarea
                value={editedAction.infoDescription || ''}
                onChange={(e) => handleChange('infoDescription', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 h-24"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasAttachments"
                checked={editedAction.hasAttachments || false}
                onChange={(e) => handleChange('hasAttachments', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="hasAttachments" className="text-sm text-gray-700">
                Requires attachments
              </label>
            </div>
          </div>
        );
        
      case 'video_upload':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution
              </label>
              <input
                type="text"
                value={editedAction.mediaSpecs?.resolution || ''}
                onChange={(e) => handleChange('mediaSpecs', {
                  ...editedAction.mediaSpecs,
                  resolution: e.target.value
                })}
                placeholder="e.g., 1920x1080"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <input
                type="text"
                value={editedAction.mediaSpecs?.format || ''}
                onChange={(e) => handleChange('mediaSpecs', {
                  ...editedAction.mediaSpecs,
                  format: e.target.value
                })}
                placeholder="e.g., MP4, MOV"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frame Rate
              </label>
              <input
                type="number"
                value={editedAction.mediaSpecs?.frameRate || ''}
                onChange={(e) => handleChange('mediaSpecs', {
                  ...editedAction.mediaSpecs,
                  frameRate: parseInt(e.target.value)
                })}
                placeholder="e.g., 30, 60"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          </div>
        );
        
      case 'video_decoupage':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decoupage Instructions
              </label>
              <textarea
                value={editedAction.decoupageInstructions || ''}
                onChange={(e) => handleChange('decoupageInstructions', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 h-24"
              />
            </div>
            
            {/* Time markers section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Markers
              </label>
              <div className="space-y-2">
                {(editedAction.timeMarkers || []).map((marker, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={marker.timestamp}
                      onChange={(e) => {
                        const newMarkers = [...(editedAction.timeMarkers || [])];
                        newMarkers[index] = {
                          ...newMarkers[index],
                          timestamp: parseInt(e.target.value)
                        };
                        handleChange('timeMarkers', newMarkers);
                      }}
                      placeholder="Timestamp (ms)"
                      className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                    />
                    <input
                      type="text"
                      value={marker.description}
                      onChange={(e) => {
                        const newMarkers = [...(editedAction.timeMarkers || [])];
                        newMarkers[index] = {
                          ...newMarkers[index],
                          description: e.target.value
                        };
                        handleChange('timeMarkers', newMarkers);
                      }}
                      placeholder="Description"
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                    />
                    <select
                      value={marker.importance}
                      onChange={(e) => {
                        const newMarkers = [...(editedAction.timeMarkers || [])];
                        newMarkers[index] = {
                          ...newMarkers[index],
                          importance: e.target.value as 'low' | 'medium' | 'high'
                        };
                        handleChange('timeMarkers', newMarkers);
                      }}
                      className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newMarkers = [...(editedAction.timeMarkers || [])];
                        newMarkers.splice(index, 1);
                        handleChange('timeMarkers', newMarkers);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const newMarkers = [...(editedAction.timeMarkers || []), {
                      timestamp: 0,
                      description: '',
                      importance: 'medium' as 'low' | 'medium' | 'high'
                    }];
                    handleChange('timeMarkers', newMarkers);
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Add Time Marker
                </button>
              </div>
            </div>
          </div>
        );
        
      // Add more cases for other action types as needed
      
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Edit Action</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Basic fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={editedAction.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={editedAction.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 h-24"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleChange('type', 'text')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'text' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type size={16} className="mr-1" /> Text
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'document')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'document' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={16} className="mr-1" /> Document
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'info')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Info size={16} className="mr-1" /> Info
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'video_upload')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'video_upload' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video size={16} className="mr-1" /> Video
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'audio_processing')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'audio_processing' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic size={16} className="mr-1" /> Audio
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'video_decoupage')}
              className={`p-2 rounded-md flex items-center justify-center ${
                editedAction.type === 'video_decoupage' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List size={16} className="mr-1" /> Decoupage
            </button>
          </div>
        </div>
        
        {/* Type-specific fields */}
        {renderTypeSpecificFields()}
        
        {/* Dependencies section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Dependencies
            </label>
            <button
              type="button"
              onClick={() => setShowDependencySelector(!showDependencySelector)}
              className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
            >
              {showDependencySelector ? 'Hide' : 'Edit'} <GitBranch size={14} className="ml-1" />
            </button>
          </div>
          
          {showDependencySelector && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
              <p className="text-sm text-gray-600 mb-2">
                Select actions that must be completed before this one:
              </p>
              
              {availableActions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No available actions to depend on.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableActions.map(a => (
                    <div key={a.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`dep-${a.id}`}
                        checked={(editedAction.dependsOn || []).includes(a.id)}
                        onChange={() => handleToggleDependency(a.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`dep-${a.id}`} className="text-sm">
                        {a.title} ({a.type})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Display current dependencies */}
          {(editedAction.dependsOn?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {editedAction.dependsOn?.map(depId => {
                const dep = allActions.find(a => a.id === depId);
                return (
                  <div key={depId} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                    <GitBranch size={12} className="mr-1" />
                    {dep?.title || 'Unknown Action'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Save size={16} className="mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
