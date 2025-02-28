
import React, { useState, useEffect } from 'react';
import { TaskAction } from '../../types/firestore-schema';
import { GitBranch, Save, X, AlertTriangle, Info } from 'lucide-react';

interface DependencyEditorProps {
  action: TaskAction;
  allActions: TaskAction[];
  onSave: (actionId: string, dependencies: string[]) => void;
  onCancel: () => void;
}

export const DependencyEditor: React.FC<DependencyEditorProps> = ({
  action,
  allActions,
  onSave,
  onCancel
}) => {
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(
    action.dependsOn || []
  );
  const [error, setError] = useState<string | null>(null);
  
  // Filter out the current action and actions that would create circular dependencies
  const availableActions = allActions.filter(a => 
    a.id !== action.id
  );
  
  // Check for potential circular dependencies
  useEffect(() => {
    try {
      // Create a temporary dependency graph
      const tempGraph = new Map<string, string[]>();
      
      // Add all existing dependencies
      allActions.forEach(a => {
        tempGraph.set(a.id, a.dependsOn || []);
      });
      
      // Override with our current selection
      tempGraph.set(action.id, [...selectedDependencies]);
      
      // Check for cycles
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) {
          return true; // Cycle detected
        }
        
        if (visited.has(nodeId)) {
          return false; // Already checked, no cycle
        }
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const dependencies = tempGraph.get(nodeId) || [];
        for (const depId of dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
        
        recursionStack.delete(nodeId);
        return false;
      };
      
      // Check if our current selection would create a cycle
      const wouldCreateCycle = hasCycle(action.id);
      
      if (wouldCreateCycle) {
        setError('This selection would create a circular dependency.');
      } else {
        setError(null);
      }
      
    } catch (err) {
      console.error('Error checking dependencies:', err);
      setError('Error validating dependencies.');
    }
  }, [selectedDependencies, action.id, allActions]);
  
  const handleToggleDependency = (actionId: string) => {
    setSelectedDependencies(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };
  
  const handleSave = () => {
    if (error) return;
    onSave(action.id, selectedDependencies);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <GitBranch className="mr-2 text-blue-600" />
          Edit Dependencies
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-gray-800 mb-1">Action: {action.title}</h3>
        <p className="text-sm text-gray-600">{action.description}</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertTriangle size={18} className="mr-2 text-red-500" />
          {error}
        </div>
      )}
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-blue-700">
        <Info size={18} className="mr-2 text-blue-500" />
        Select actions that must be completed before this one can be started.
      </div>
      
      <div className="max-h-60 overflow-y-auto mb-4 border rounded-lg divide-y">
        {availableActions.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">No other actions available in this workflow.</p>
        ) : (
          availableActions.map(a => {
            const isSelected = selectedDependencies.includes(a.id);
            const isCompleted = a.completed;
            
            return (
              <div 
                key={a.id} 
                className={`p-3 flex items-center hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  i