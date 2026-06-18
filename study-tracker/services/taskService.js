import { supabase } from "@/lib/supabase";

async function getTasks(userID) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userID);

  if (error) {
    return {
      error: {
        message: error.message || "Failed to fetch tasks",
        status: 400,
      },
    };
  }

  return data;
}

async function createTask(taskData) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    return {
      error: {
        message: error.message || "Failed to create task",
        status: 400,
      },
    };
  }

  return data;
}

async function updateTask(taskId, updatedData) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updatedData)
    .eq("id", taskId)
    .select()
    .single();
    if (error) {
      return {
        error: {
          message: error.message || "Failed to update task",
          status: 400,
        },
      };
    }
}
async function deleteTask(taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select()
    .single();
    if (error) {
      return {
        error: {
          message: error.message || "Failed to delete task",   
           status: 400,
        },
      };
    }
    return data;}

async function getTaskById(taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single(); 
    if (error) {
      if (error) {
        return {
          error: {
            message: "Task not found",
            status: 404,
          },
        };  
      }
    }
    return data;
}

async function changeTaskStatus(taskId, completeTask) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ completeTask: completeTask })
      .eq("id", taskId)
      .select()
      .single();
      if (error) {
        return {
          error: {
            message: error.message || "Failed to change task status",
            status: 400,
          },
        };
      }
    return data;    
}