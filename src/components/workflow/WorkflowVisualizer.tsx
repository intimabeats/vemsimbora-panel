import React, { useMemo } from 'react';
import { TaskAction } from '../../types/firestore-schema';
import { GitBranch, GitMerge, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface WorkflowVisualizerProps {
  actions: TaskAction[];
  onSelectAction?: (actionId: string) => void;
  highlightActionId?: string;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ 
  actions, 
  onSelectAction,
  highlightActionId
}) => {
  // Organize actions into levels based on dependencies
  const actionLevels = useMemo(() => {
    const actionMap = new Map<string, TaskAction>();
    actions.forEach(action => actionMap.set(action.id, action));
    
    // Find actions with no dependencies (initial actions)
    const initialActions = actions.filter(action => 
      !action.dependsOn || action.dependsOn.length === 0
    );
    
    // Organize in levels
    const levels: TaskAction[][] = [];
    let currentLevel = initialActions;
    
    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      
      // Find next level (actions that depend only on actions already processed)
      const processedActionIds = new Set<string>();
      levels.flat().forEach(action => processedActionIds.add(action.id));
      
      const nextLevel = actions.filter(action => {
        if (processedActionIds.has(action.id)) return false;
        
        // Check if all dependencies are already processed
        return action.dependsOn?.every(depId => processedActionIds.has(depId)) ?? true;
      });
      
      currentLevel = nextLevel;
    }
    
    return levels;
  }, [actions]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (actions.length === 0) return 0;
    const completedCount = actions.filter(a => a.completed).length;
    return Math.round((completedCount / actions.length) * 100);
  }, [actions]);

  // Get action status class
  const getActionStatusClass = (action: TaskAction) => {
    if (action.id === highlightActionId) {
      return 'border-2 border-blue-500 bg-blue-50';
    }
    
    if (action.completed) {
      return 'bg-green-50 border-green-200';
    }
    
    // Check if all dependencies are completed
    const allDependenciesCompleted = !action.dependsOn || action.dependsOn.length === 0 || 
      action.dependsOn.every(depId => {
        const dep = actions.find(a => a.id === depId);
        return dep && dep.completed;
      });
    
    if (!allDependenciesCompleted) {
      return 'bg-gray-100 border-gray-200 opacity-60'; // Blocked
    }
    
    return 'bg-yellow-50 border-yellow-200'; // Available but not completed
  };

  // Get action status icon
  const getActionStatusIcon = (action: TaskAction) => {
    if (action.completed) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    
    // Check if all dependencies are completed
    const allDependenciesCompleted = !action.dependsOn || action.dependsOn.length === 0 || 
      action.dependsOn.every(depId => {
        const dep = actions.find(a => a.id === depId);
        return dep && dep.completed;
      });
    
    if (!allDependenciesCompleted) {
      return <AlertTriangle size={16} className="text-gray-400" />;
    }
    
    return <Clock size={16} className="text-yellow-500" />;
  };

  if (actions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No actions defined for this workflow.
      </div>
    );
  }

  return (
    <div className="workflow-visualizer">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Workflow Progress</span>
          <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Workflow visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="workflow-levels flex flex-col space-y-8 min-w-max">
          {actionLevels.map((level, levelIndex) => (
            <div key={levelIndex} className="flex items-start space-x-4">
              {level.map(action => (
                <div 
                  key={action.id}
                  onClick={() => onSelectAction?.(action.id)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    hover:shadow-md ${getActionStatusClass(action)}
                    ${onSelectAction ? 'hover:border-blue-400' : ''}
                    max-w-xs
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-800 truncate">{action.title}</div>
                    {getActionStatusIcon(action)}
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-2">{action.description}</p>
                  
                  {action.dependsOn && action.dependsOn.length > 0 && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <GitBranch size={12} className="mr-1" />
                      <span>Depends on {action.dependsOn.length} action{action.dependsOn.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Connecting lines (optional - requires CSS) */}
      <style jsx>{`
        .workflow-levels {
          position: relative;
        }
        
        /* Add custom CSS for connecting lines if needed */
      `}</style>
    </div>
  );
};
