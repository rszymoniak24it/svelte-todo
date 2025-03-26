<script lang="ts">
  import {createEventDispatcher} from "svelte";
  import {updateTask} from "../stores/taskStore";

  export let isOpen = false;
  export let tasks = [];

  const dispatch = createEventDispatcher();

  // Fields to edit
  let description = "";
  let dueDate = "";
  let alarm = false;
  let completed = false;

  // Track modified fields
  let modifiedFields = new Set();

  // Check if all tasks have the same value for a given field
  function getCommonValue(field) {
    const values = tasks.map(task => task[field]);
    return values.every(val => val === values[0]) ? values[0] : "";
  }

  // Initialize fields when tasks are selected
  $: if (tasks.length > 0) {
    description = getCommonValue("description");
    dueDate = getCommonValue("dueDate");
    alarm = getCommonValue("alarm");
    completed = getCommonValue("completed");
  }

  $: hasDifferentValues = {
    description: tasks.map(t => t.description).some((val, _, arr) => val !== arr[0]),
    dueDate: tasks.map(t => t.dueDate).some((val, _, arr) => val !== arr[0]),
    alarm: tasks.map(t => t.alarm).some((val, _, arr) => val !== arr[0]),
    completed: tasks.map(t => t.completed).some((val, _, arr) => val !== arr[0])
  };

  function markModified(field, value) {
    modifiedFields = new Set(modifiedFields).add(field);
    tasks = tasks.map(task => ({...task, [field]: value}));
  }

  async function saveChanges() {
    let updates: any = {};
    if (modifiedFields.has("description")) updates.description = description;
    if (modifiedFields.has("dueDate")) updates.dueDate = dueDate;
    if (modifiedFields.has("alarm")) updates.alarm = alarm;
    if (modifiedFields.has("completed")) updates.completed = completed;

    for (let task of tasks) {
      await updateTask(task.id, updates);
    }

    dispatch("tasksUpdated");
    closeModal();
  }

  function closeModal() {
    modifiedFields = new Set();
    dispatch("close");
  }
</script>

{#if isOpen}
    <div class="modal">
        <h2>Edit Multiple Tasks</h2>

        <div class="form-group">
            <label>Description:</label>
            <textarea bind:value={description} on:input={(e) => markModified("description", e.target.value)}></textarea>
            {#if hasDifferentValues.description}
                <span class="warning">Different values</span>
            {/if}`
            {#if modifiedFields.has("description")}
                <span class="modified-icon">✔️</span>
            {/if}
        </div>

        <div class="form-group">
            <label>Due Date:</label>
            <input type="datetime-local" bind:value={dueDate} on:input={(e) => markModified("dueDate", e.target.value)}/>
            {#if hasDifferentValues.dueDate}
                <span class="warning">Different values</span>
            {/if}
            {#if modifiedFields.has("dueDate")}
                <span class="modified-icon">✔️</span>
            {/if}
        </div>

        <div class="checkbox-group">
            <input type="checkbox" bind:checked={alarm} on:change={(e) => markModified("alarm", e.target.checked)}/>
            <label>Enable Alarm</label>
            {#if hasDifferentValues.alarm}
                <span class="warning">Different values</span>
            {/if}
            {#if modifiedFields.has("alarm")}
                <span class="modified-icon">✔️</span>
            {/if}
        </div>

        <div class="checkbox-group">
            <input type="checkbox" bind:checked={completed} on:change={(e) => markModified("completed", e.target.checked)}/>
            <label>Mark as Completed</label>
            {#if hasDifferentValues.completed}
                <span class="warning">Different values</span>
            {/if}
            {#if modifiedFields.has("completed")}
                <span class="modified-icon">✔️</span>
            {/if}
        </div>

        <div class="button-group">
            <button on:click={saveChanges}>Save</button>
            <button on:click={closeModal}>Cancel</button>
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

    .modified-icon {
        color: green;
        font-size: 1.2em;
        margin-left: 5px;
    }

    .warning {
        color: red;
        font-size: 0.9em;
        margin-left: 10px;
    }

    .button-group {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
</style>
