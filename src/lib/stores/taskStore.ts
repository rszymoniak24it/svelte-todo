import Dexie from "dexie";
import { writable } from "svelte/store";

// Define the structure of a task
export type Task = {
  id?: number;
  title: string;
  description?: string;
  dueDate: string; // ISO format date string
  completed: boolean;
  alarm: boolean;
};

// Define the database
class TaskDatabase extends Dexie {
  tasks: Dexie.Table<Task, number>;

  constructor() {
    super("TaskDB");
    this.version(1).stores({
      tasks: "++id, title, dueDate, completed, alarm",
    });
    this.tasks = this.table("tasks");
  }
}

export const db = new TaskDatabase();

// Create a Svelte store
const tasksStore = writable<Task[]>([]);

// Load tasks from IndexedDB
export const loadTasks = async () => {
  const allTasks = await db.tasks.toArray();

  tasksStore.set(allTasks);
};

// Add a new task
export const addTask = async (task: Task) => {
  const id = await db.tasks.add(task);
  await loadTasks();
  return id;
};

// Update a task
export const updateTask = async (id: number, updatedFields: Partial<Task>) => {
  await db.tasks.update(id, updatedFields);
  await loadTasks();
};


// Delete tasks
export const deleteTasks = async (ids: number) => {
  await db.tasks.delete(ids);
  await loadTasks();
};

// Export the store
export default tasksStore;
