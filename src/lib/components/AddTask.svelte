<script lang="ts">
  import {createEventDispatcher} from "svelte";
  import {addTask, updateTask} from "../stores/taskStore";
  import type {Task} from "../stores/taskStore";

  export let task: Task | null = null; // Task to edit, or null for adding a new one
  export let isOpen = false;

  let title = "";
  let description = "";
  let dueDate = "";
  let alarm = false;
  let completed = false;

  const dispatch = createEventDispatcher();

  // Populate fields if editing
  $: if (task) {
    title = task.title;
    description = task.description || "";
    dueDate = task.dueDate;
    alarm = task.alarm || false;
    completed = task.completed || false;
  }

  // Function to save or update a task
  const saveTask = async () => {
    if (!title.trim() || !dueDate) {
      alert("Task Name and Due Date are required!");
      return;
    }

    const taskData: Task = {
      ...task, // Keep existing task ID if editing
      title,
      description,
      dueDate,
      alarm,
      completed
    };

    if (task?.id) {
      await updateTask(task.id, taskData);
      dispatch("taskUpdated");
    } else {
      await addTask(taskData);
      dispatch("taskAdded");
    }

    closeModal();
  };

  // Close modal event
  const closeModal = () => {
    dispatch("close");
  };
</script>

{#if isOpen}
    <!-- Task Form -->
    <div class="modal">
        <h2>{task.title ? "Edit Task" : "Add Task"}</h2>

        <div class="form-group">
            <label>Task Name:</label>
            <input type="text" bind:value={title} required/>
        </div>

        <div class="form-group">
            <label>Description:</label>
            <textarea bind:value={description}></textarea>
        </div>

        <div class="form-group">
            <label>Due Date:</label>
            <input type="datetime-local" bind:value={dueDate} required/>
        </div>

        <div class="checkbox-group">
            <input type="checkbox" bind:checked={alarm}/>
            <label>Enable Alarm</label>
        </div>

        <div class="checkbox-group">
            <input type="checkbox" bind:checked={completed}/>
            <label>Mark as Completed</label>
        </div>

        <div class="button-group">
            <button class="save-btn" on:click={saveTask}>{task.title ? "Update Task" : "Save Task"}</button>
            <button class="cancel-btn" on:click={closeModal}>Cancel</button>
        </div>
    </div>
{/if}


<style>
    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        animation: fadeIn 0.3s ease-in-out;
        z-index: 1;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translate(-50%, -55%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%);
        }
    }

    .modal button {
        margin-top: 10px;
        padding: 10px;
        cursor: pointer;
        border: none;
        border-radius: 5px;
    }

    /* Form Styles */
    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 15px;
    }

    label {
        font-weight: bold;
        margin-bottom: 5px;
    }

    input[type="text"],
    input[type="datetime-local"],
    textarea {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 14px;
    }

    textarea {
        min-height: 60px;
    }

    /* Checkbox container */
    .checkbox-group {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }

    .checkbox-group input {
        width: 16px;
        height: 16px;
    }

    /* Button Styles */
    .button-group {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
</style>
