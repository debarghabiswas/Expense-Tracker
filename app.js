$(function () {
  const STORAGE_KEY = "pennywise-expenses";
  const categoryIcons = {
    Food: "🍽️",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "🧾",
    Health: "💊",
    Other: "✦"
  };

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadExpenses() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const expenses = saved ? JSON.parse(saved) : [];
      return Array.isArray(expenses) ? expenses : [];
    } catch (error) {
      console.error("Could not load expenses from local storage.", error);
      $("#formMessage").text("Saved expenses could not be loaded.");
      return [];
    }
  }

  let expenses = loadExpenses();

  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      return true;
    } catch (error) {
      console.error("Could not save expenses to local storage.", error);
      $("#formMessage").text("Could not save changes. Check your browser storage.");
      return false;
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount);
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function renderExpenses() {
    const query = $("#searchInput").val().trim().toLowerCase();
    const category = $("#filterCategory").val();
    const visibleExpenses = expenses
      .filter((expense) => !category || expense.category === category)
      .filter((expense) => expense.description.toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));

    const $list = $("#expenseList").empty();

    visibleExpenses.forEach((expense) => {
      const $row = $("<article>").addClass("expense-row");
      const $icon = $("<span>")
        .addClass("category-icon")
        .attr("aria-hidden", "true")
        .text(categoryIcons[expense.category] || "✦");
      const $detail = $("<div>").addClass("expense-detail");
      $("<strong>").text(expense.description).appendTo($detail);
      $("<span>")
        .text(`${expense.category} · ${formatDate(expense.date)}`)
        .appendTo($detail);

      const $right = $("<div>").addClass("expense-right");
      $("<span>")
        .addClass("expense-amount")
        .text(formatCurrency(expense.amount))
        .appendTo($right);

      $("<button>")
        .addClass("delete-button")
        .attr({
          type: "button",
          "data-id": expense.id,
          "aria-label": `Delete ${expense.description}`
        })
        .text("×")
        .appendTo($right);

      $row.append($icon, $detail, $right).appendTo($list);
    });

    const now = new Date();
    const thisMonth = localDateString(now).slice(0, 7);
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthTotal = expenses
      .filter((expense) => expense.date.startsWith(thisMonth))
      .reduce((sum, expense) => sum + expense.amount, 0);

    $("#totalAmount").text(formatCurrency(total));
    $("#monthAmount").text(formatCurrency(monthTotal));
    $("#expenseCount").text(expenses.length);
    $("#listCount").text(`${visibleExpenses.length} ${visibleExpenses.length === 1 ? "item" : "items"}`);
    $("#emptyState").toggle(visibleExpenses.length === 0);
  }

  $("#date").val(localDateString(new Date()));

  $("#expenseForm").on("submit", function (event) {
    event.preventDefault();
    $("#formMessage").text("");

    const description = $("#description").val().trim();
    const amount = Number($("#amount").val());
    const category = $("#category").val();
    const date = $("#date").val();

    if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
      $("#formMessage").text("Enter a description, a positive amount, and a date.");
      return;
    }

    const expense = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description,
      amount,
      category,
      date
    };

    expenses.push(expense);
    if (!saveExpenses()) {
      expenses.pop();
      return;
    }

    this.reset();
    $("#date").val(localDateString(new Date()));
    renderExpenses();
    $("#description").trigger("focus");
  });

  $("#expenseList").on("click", ".delete-button", function () {
    const id = $(this).attr("data-id");
    const previousExpenses = expenses;
    expenses = expenses.filter((expense) => expense.id !== id);

    if (!saveExpenses()) {
      expenses = previousExpenses;
      return;
    }

    renderExpenses();
  });

  $("#searchInput, #filterCategory").on("input change", renderExpenses);

  renderExpenses();
});