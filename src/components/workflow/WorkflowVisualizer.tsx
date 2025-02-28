
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