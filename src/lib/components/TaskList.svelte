<script lang="ts">
  import taskStore, {loadTasks, updateTask, deleteTasks} from "../stores/taskStore";
  import {onMount} from "svelte";
  import type {Task} from "../stores/taskStore";
  import {browser} from "$app/environment";
  import AddTask from "./AddTask.svelte";
  import Chart from "chart.js/auto";
  import AddTaskBulk from "$lib/components/AddTaskBulk.svelte";

  let tasks = [];

  // modal
  let isModalOpen = false;
  let isBulkEditModalOpen = false;
  let selectedTask = null;
  let selectedTasks = [];
  let selectedTaskIds = new Set();

  // filter, sort, search related
  let filter = "all";
  let sortColumn = "dueDate";
  let sortOrder = "asc";
  let searchTitle = "";
  let searchDueDate = "";
  let searchInput = "";
  let searchInputDueDate = "";

  // alarm
  let alarmCount = 0;

  onMount(() => {
    loadTasks();
    if (browser) {
      filter = localStorage.getItem("filter") || "all";
      sortColumn = localStorage.getItem("sortColumn") || "dueDate";
      sortOrder = localStorage.getItem("sortOrder") || "asc";
      searchInput = localStorage.getItem("searchInput") || "";
      searchInputDueDate = localStorage.getItem("searchInputDueDate") || "";
      searchInput !== "" ? searchTitle = searchInput : '';
      searchInputDueDate !== "" ? searchDueDate = searchInputDueDate : '';
    }
    checkAlarms();
    setInterval(checkAlarms, 60000);
  });

  // Function to update alarm count
  function checkAlarms() {
    let now = new Date().toISOString();
    taskStore.subscribe(value => {
      alarmCount = value.filter(task => !task.completed && task.alarm && task.dueDate < now).length;
    });
  }

  function saveFilterSettings() {
    localStorage.setItem("filter", filter);
    localStorage.setItem("sortColumn", sortColumn);
    localStorage.setItem("sortOrder", sortOrder);
    localStorage.setItem("searchInput", searchInput);
    localStorage.setItem("searchInputDueDate", searchInputDueDate);
  }

  function setFilter(newFilter) {
    filter = newFilter;
    saveFilterSettings();
    updateChart();
  }

  function getFilteredTasks() {
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const now = new Date();

      if (filter === "completed") return task.completed;
      if (filter === "pending") return !task.completed && dueDate >= now;
      if (filter === "overdue") return !task.completed && dueDate < now;
      return true; // "all" case
    });
  }

  const toggleCompletion = async (task: Task) => {
    await updateTask(task.id!, {completed: !task.completed});
  };

  const toggleAlarm = async (task: Task) => {
    await updateTask(task.id!, {alarm: !task.alarm});
  };

  function openEditModal(task) {
    if (task !== undefined) {
      selectedTask = task;
    }
    isModalOpen = true;
  }

  function openBulkEditModal() {
    selectedTasks = tasks.filter(task => selectedTaskIds.has(task.id));
    console.log(selectedTasks);
    if (selectedTasks.length > 0) {
      isBulkEditModalOpen = true;
    } else {
      alert("Please select at least one task to edit.");
    }
  }

  function confirmDelete(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTasks(taskId);
    }
  }

  function toggleSelection(taskId) {
    if (selectedTaskIds.has(taskId)) {
      selectedTaskIds.delete(taskId);
    } else {
      selectedTaskIds.add(taskId);
    }
  }

  function deleteSelectedTasks() {
    if (confirm("Are you sure you want to delete selected tasks?")) {
      selectedTaskIds.forEach(id => deleteTasks(id));
      selectedTaskIds.clear();
    }
  }

  function sortTasks(column) {
    sortColumn = column;
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
    saveFilterSettings();
  }

  function getSortedTasks() {
    return getFilteredTasks().sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      let descSort, ascSort;
      if (sortColumn === "dueDate") {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      if (sortColumn === 'title' | sortColumn === 'description') {
        descSort = valB.toLowerCase().localeCompare(valA.toLowerCase());
        ascSort = valA.toLowerCase().localeCompare(valB.toLowerCase());
      } else {
        descSort = valB - valA;
        ascSort = valA - valB;
      }

      return sortOrder === "asc" ? ascSort : descSort;
    });
  }

  function getSearchedTasks() {
    const titleTerms = searchTitle.toLowerCase().split(" ").filter(term => term.length > 0);
    const dateTerms = searchDueDate.toLowerCase().split(" ").filter(term => term.length > 0);

    return getSortedTasks().filter(task => {
      const titleMatches = titleTerms.every(term =>
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
      );

      const dateMatches = dateTerms.every(term => task.dueDate.includes(term));

      return titleMatches && dateMatches;
    });
  }

  // chart
  let chartCanvas = null;
  let chartInstance = null;

  function processTaskData() {
    let counts = {};

    getSearchedTasks().forEach(task => {
      let date = task.dueDate.split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    const sortedEntries = Object.entries(counts).sort(([a], [b]) => new Date(a) - new Date(b));
    const sortedTaskData = Object.fromEntries(sortedEntries);

    return {
      labels: Object.keys(sortedTaskData),
      data: Object.values(sortedTaskData),
    };
  }

  function updateChart() {
    if (!chartCanvas) {
      return;
    }

    let ctx = chartCanvas.getContext("2d");
    let {labels, data} = processTaskData();

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tasks per Day",
            data: data,
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  taskStore.subscribe(value => {
    tasks = value;
    selectedTaskIds.clear();
    updateChart();
  });

</script>

<div class="chart-container">
    <canvas bind:this={chartCanvas}></canvas>
</div>
<AddTask isOpen={isModalOpen} task={selectedTask} on:taskUpdated={loadTasks} on:close={() => isModalOpen = false}/>
<AddTaskBulk
        tasks={selectedTasks}
        on:close={() => {isBulkEditModalOpen = false;}}
        isOpen={isBulkEditModalOpen}
        on:tasksUpdated={loadTasks}
/>

<div class="task-list">
    <!-- Alarm Notification -->
    {#if alarmCount > 0}
        <div class="alarm-notification">ALARM ({alarmCount})</div>
    {/if}
    <h1>Task Manager</h1>

    <!-- Bulk Delete Button -->
    <button on:click={openEditModal}>Add Task</button>
    <button on:click={deleteSelectedTasks}>Delete Selected</button>
    <button on:click={openBulkEditModal}>Edit</button>

    <!-- Tabs for Filtering -->
    <div class="tabs">
        <button on:click={() => setFilter("all")} class={filter === "all" ? "active" : ""}>All</button>
        <button on:click={() => setFilter("completed")} class={filter === "completed" ? "active" : ""}>Completed
        </button>
        <button on:click={() => setFilter("pending")} class={filter === "pending" ? "active" : ""}>Pending</button>
        <button on:click={() => setFilter("overdue")} class={filter === "overdue" ? "active" : ""}>Overdue</button>
    </div>

    <!-- Search Inputs Above Table -->
    <input type="text" bind:value={searchInput} on:input={saveFilterSettings}
           on:keydown={(e) => { if (e.key === "Enter") searchTitle = searchInput; updateChart();}}
           placeholder="Search Task..."/>
    <input type="text" bind:value={searchInputDueDate} on:input={saveFilterSettings}
           on:keydown={(e) => { if (e.key === "Enter") searchDueDate = searchInputDueDate; updateChart();}}
           placeholder="Search Date..."/>


    {#key tasks}
        <table>
            <thead>
            <tr>
                <th>Id</th>
                <th on:click={() => sortTasks("title")}>
                    Task {sortColumn === "title" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : ""}</th>
                <th on:click={() => sortTasks("dueDate")}>
                    Due Date {sortColumn === "dueDate" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : ""}</th>
                <th on:click={() => sortTasks("description")}>
                    Description {sortColumn === "description" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : ""}</th>
                <th on:click={() => sortTasks("completed")}>
                    Completed {sortColumn === "completed" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : ""}</th>
                <th on:click={() => sortTasks("alarm")}>
                    Alarm {sortColumn === "alarm" ? (sortOrder === "asc" ? "⬆️" : "⬇️") : ""}</th>
                <th> Actions</th>
            </tr>
            </thead>
            <tbody>
            {#each getSearchedTasks() as task}
                <tr class={task.completed ? "completed" : (new Date(task.dueDate) < new Date() ? "overdue" : "")}>
                    <td><input type="checkbox" on:change={() => toggleSelection(task.id)}/></td>
                    <td>{task.title}</td>
                    <td>{task.dueDate}</td>
                    <td>{task.description}</td>
                    <td><input type="checkbox" checked={task.completed} on:change={() => toggleCompletion(task)}></td>
                    <td><input type="checkbox" checked={task.alarm} on:change={() => toggleAlarm(task)}></td>
                    <td>
                        <button on:click={() => openEditModal(task)}>Edit</button>
                        <button on:click={() => confirmDelete(task.id)}>Delete</button>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
    {/key}
</div>


<style>
    .tabs {
        padding: 10px 0;
    }

    .task-list {
        width: 100%;
        max-width: 800px;
        margin: auto;
        border-collapse: collapse;
    }

    .task-list th, .task-list td {
        padding: 10px;
        border: 1px solid #ddd;
        text-align: left;
    }

    .task-list th {
        background-color: #f4f4f4;
        cursor: pointer;
        transition: background 0.3s;
    }

    .task-list th:hover {
        background-color: #ddd;
    }

    .task-list tr {
        transition: background-color 0.3s;
    }

    .task-list tr.completed {
        background-color: #d4edda;
    }

    .task-list tr.overdue {
        background-color: #f8d7da;
    }

    .task-list input[type="checkbox"] {
        transform: scale(1.2);
    }

    button {
        margin-top: 10px;
        padding: 10px;
        cursor: pointer;
        border: none;
        border-radius: 5px;
    }

    input[type="text"],
    input[type="datetime-local"],
    textarea {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 14px;
    }

    .alarm-notification {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        background: red;
        color: white;
        font-weight: bold;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    .chart-container {
        width: 100%;
        height: 300px;
    }
</style>

