import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, TrendingUp, Calendar, Clock, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: number;
  type: "daily" | "weekly";
  target: number;
  current: number;
  date: string;
}

interface StudentGoalsProps {
  studentRegNo: string;
}

export function StudentGoals({ studentRegNo }: StudentGoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/student", studentRegNo, "goals"],
  });

  const { data: todayProgress } = useQuery<{ completed_today: number }>({
    queryKey: ["/api/student", studentRegNo, "today-progress"],
  });

  const { data: weekProgress } = useQuery<{ completed_week: number }>({
    queryKey: ["/api/student", studentRegNo, "week-progress"],
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest("DELETE", `/api/student/${studentRegNo}/goals/${goalId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", studentRegNo, "goals"] });
      toast({
        title: "Goal Deleted",
        description: "Your goal has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No goals set yet</p>
          <p className="text-sm text-slate-500">Set a daily or weekly goal to track your progress</p>
        </CardContent>
      </Card>
    );
  }

  const dailyGoal = goals.find(g => g.type === "daily");
  const weeklyGoal = goals.find(g => g.type === "weekly");

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-slate-400";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-100 text-blue-700">Almost There</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
    return <Badge className="bg-slate-100 text-slate-700">Just Started</Badge>;
  };

  const GoalCard = ({ goal, progress, type }: { goal: Goal; progress: number; type: "daily" | "weekly" }) => {
    const percentage = getProgressPercentage(progress, goal.target);
    const Icon = type === "daily" ? Clock : Calendar;
    const title = type === "daily" ? "Daily Goal" : "Weekly Goal";

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(percentage)}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this {type} goal? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Goal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">
                {progress} of {goal.target} problems
              </span>
              <span className="text-sm font-semibold">
                {percentage}%
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {dailyGoal && (
        <GoalCard 
          goal={dailyGoal} 
          progress={todayProgress?.completed_today || 0} 
          type="daily" 
        />
      )}

      {weeklyGoal && (
        <GoalCard 
          goal={weeklyGoal} 
          progress={weekProgress?.completed_week || 0} 
          type="weekly" 
        />
      )}
    </div>
  );
}