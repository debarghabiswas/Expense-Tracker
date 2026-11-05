$(function () {
  const STORAGE_KEY = "pennywise-expenses";
  const BUDGET_STORAGE_KEY = "pennywise-budgets";
  const categories = ["Food", "Transport", "Shopping", "Bills", "Health", "Other"];
  let editingTransactionId = null;
  const categoryIcons = {
    Food: "🍽️",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "🧾",
    Health: "💊",
    Other: "✦"
  };
  const categoryColors = {
    Food: "#f0a35e",
    Transport: "#6da9e8",
    Shopping: "#c58ae8",
    Bills: "#e8ce66",
    Health: "#e87979",
    Other: "#56c99b"
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
      return Array.isArray(expenses)
        ? expenses.map((expense) => ({
          ...expense,
          type: expense.type === "income" ? "income" : "expense"
        }))
        : [];
    } catch (error) {
      console.error("Could not load expenses from local storage.", error);
      $("#formMessage").text("Saved expenses could not be loaded.");
      return [];
    }
  }

  let expenses = loadExpenses();

  function loadBudgets() {
    try {
      const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
      const budgets = saved ? JSON.parse(saved) : {};
      if (!budgets || Array.isArray(budgets) || typeof budgets !== "object") {
        return {};
      }

      return Object.fromEntries(
        Object.entries(budgets).filter(([category, amount]) =>
          categories.includes(category) && Number.isFinite(amount) && amount > 0
        )
      );
    } catch (error) {
      console.error("Could not load budgets from local storage.", error);
      $("#budgetMessage").text("Saved budgets could not be loaded.");
      return {};
    }
  }

  let budgets = loadBudgets();

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

  function saveBudgets() {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
      return true;
    } catch (error) {
      console.error("Could not save budgets to local storage.", error);
      $("#budgetMessage").text("Could not save budget changes. Check your browser storage.");
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

  function renderCharts() {
    const expenseTransactions = expenses.filter((transaction) => transaction.type !== "income");
    const categoryTotals = expenseTransactions.reduce((totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      return totals;
    }, {});
    const categories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);
    const maxCategoryTotal = Math.max(...categories.map(([, amount]) => amount), 0);
    const $categoryChart = $("#categoryChart").empty();

    categories.forEach(([category, amount]) => {
      const percentage = (amount / maxCategoryTotal) * 100;
      const $row = $("<div>").addClass("category-bar-row").attr("role", "listitem");
      const $details = $("<div>").addClass("category-bar-details");
      $("<span>").addClass("category-bar-label").text(category).appendTo($details);
      $("<strong>").text(formatCurrency(amount)).appendTo($details);

      const $track = $("<div>").addClass("category-bar-track").attr("aria-hidden", "true");
      $("<span>")
        .addClass("category-bar-fill")
        .css({
          width: `${percentage}%`,
          "--bar-color": categoryColors[category] || categoryColors.Other
        })
        .appendTo($track);

      $row.append($details, $track).appendTo($categoryChart);
    });
    $("#categoryChartEmpty").toggle(categories.length === 0);

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = expenseTransactions
        .filter((expense) => expense.date.startsWith(key))
        .reduce((sum, expense) => sum + expense.amount, 0);
      return {
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
        year: date.getFullYear(),
        amount
      };
    });
    const maxMonthTotal = Math.max(...months.map((month) => month.amount), 0);
    const $monthlyChart = $("#monthlyChart").empty();

    months.forEach((month) => {
      const barHeight = maxMonthTotal > 0
        ? Math.max((month.amount / maxMonthTotal) * 100, month.amount > 0 ? 6 : 0)
        : 0;
      const $column = $("<div>")
        .addClass("month-column")
        .attr({
          role: "listitem",
          "aria-label": `${month.label} ${month.year}: ${formatCurrency(month.amount)}`
        });
      $("<span>")
        .addClass("month-value")
        .text(month.amount > 0 ? formatCurrency(month.amount) : "—")
        .appendTo($column);

      const $track = $("<div>").addClass("month-bar-track").attr("aria-hidden", "true");
      $("<span>")
        .addClass("month-bar-fill")
        .css("height", `${barHeight}%`)
        .appendTo($track);
      $column.append($track);
      $("<span>").addClass("month-label").text(month.label).appendTo($column);
      $column.appendTo($monthlyChart);
    });
    const hasMonthlyData = months.some((month) => month.amount > 0);
    $monthlyChart.toggle(hasMonthlyData);
    $("#monthlyChartEmpty").toggle(!hasMonthlyData);
  }

  function renderBudgets() {
    const now = new Date();
    const currentMonth = localDateString(now).slice(0, 7);
    const $list = $("#budgetList").empty();

    Object.entries(budgets)
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .forEach(([category, limit]) => {
        const spent = expenses
          .filter((transaction) =>
            transaction.type !== "income" &&
            transaction.category === category &&
            transaction.date.startsWith(currentMonth)
          )
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const remaining = limit - spent;
        const percentage = Math.min((spent / limit) * 100, 100);
        const isOverBudget = remaining < 0;
        const $item = $("<article>").addClass("budget-item").attr("role", "listitem");
        const $header = $("<div>").addClass("budget-item-header");
        $("<strong>").text(category).appendTo($header);

        const $values = $("<span>").addClass("budget-values");
        $("<span>")
          .text(`${formatCurrency(spent)} of ${formatCurrency(limit)}`)
          .appendTo($values);
        $("<span>")
          .addClass("budget-remaining")
          .toggleClass("over-budget", isOverBudget)
          .text(isOverBudget
            ? `${formatCurrency(Math.abs(remaining))} over`
            : `${formatCurrency(remaining)} left`)
          .appendTo($values);

        const $track = $("<div>")
          .addClass("budget-progress")
          .toggleClass("over-budget", isOverBudget)
          .attr({
            role: "progressbar",
            "aria-label": `${category} monthly budget`,
            "aria-valuemin": 0,
            "aria-valuemax": limit,
            "aria-valuenow": Math.min(spent, limit)
          });
        $("<span>").css("width", `${percentage}%`).appendTo($track);

        const $remove = $("<button>")
          .addClass("budget-remove")
          .attr({
            type: "button",
            "data-category": category,
            "aria-label": `Remove ${category} budget`
          })
          .text("×");
        $item.append($header, $values, $track, $remove).appendTo($list);
      });

    $("#budgetEmpty").toggle(Object.keys(budgets).length === 0);
  }

  function renderExpenses() {
    const query = $("#searchInput").val().trim().toLowerCase();
    const category = $("#filterCategory").val();
    const type = $("#filterType").val();
    const visibleExpenses = expenses
      .filter((expense) => !category || expense.category === category)
      .filter((expense) => !type || expense.type === type)
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
        .text(`${expense.type === "income" ? "Income" : "Expense"} · ${expense.category} · ${formatDate(expense.date)}`)
        .appendTo($detail);

      const $right = $("<div>").addClass("expense-right");
      $("<span>")
        .addClass("expense-amount")
        .toggleClass("income-amount", expense.type === "income")
        .text(`${expense.type === "income" ? "+" : "−"}${formatCurrency(expense.amount)}`)
        .appendTo($right);

      $("<button>")
        .addClass("edit-button")
        .attr({
          type: "button",
          "data-id": expense.id,
          "aria-label": `Edit ${expense.description}`
        })
        .text("Edit")
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
    const total = expenses
      .filter((expense) => expense.type !== "income")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const income = expenses
      .filter((expense) => expense.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const monthTotal = expenses
      .filter((expense) => expense.type !== "income" && expense.date.startsWith(thisMonth))
      .reduce((sum, expense) => sum + expense.amount, 0);

    $("#totalAmount").text(formatCurrency(total));
    $("#incomeAmount").text(formatCurrency(income));
    $("#balanceAmount").text(formatCurrency(income - total));
    $("#monthAmount").text(formatCurrency(monthTotal));
    $("#transactionCount").text(expenses.length);
    $("#listCount").text(`${visibleExpenses.length} ${visibleExpenses.length === 1 ? "item" : "items"}`);
    $("#emptyState").toggle(visibleExpenses.length === 0);
    renderCharts();
    renderBudgets();
  }

  $("#date").val(localDateString(new Date()));
  $("#budgetCategory").val("Food");

  $("#expenseForm").on("submit", function (event) {
    event.preventDefault();
    $("#formMessage").text("");

    const description = $("#description").val().trim();
    const amount = Number($("#amount").val());
    const category = $("#category").val();
    const date = $("#date").val();
    const type = $("#transactionType").val();

    if (!description || !Number.isFinite(amount) || amount <= 0 || !date ||
        !["income", "expense"].includes(type)) {
      $("#formMessage").text("Enter a description, a positive amount, type, and date.");
      return;
    }

    const transaction = {
      id: editingTransactionId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description,
      amount,
      category,
      date,
      type
    };

    const oldIndex = expenses.findIndex((expense) => expense.id === editingTransactionId);
    const previousExpenses = [...expenses];
    if (oldIndex >= 0) {
      expenses[oldIndex] = transaction;
    } else {
      expenses.push(transaction);
    }

    if (!saveExpenses()) {
      expenses = previousExpenses;
      return;
    }

    editingTransactionId = null;
    this.reset();
    $("#transactionType").val("expense");
    $("#date").val(localDateString(new Date()));
    $("#transactionFormTitle").text("Add a transaction");
    $("#transactionSubmit").html("Add transaction <span>→</span>");
    $("#cancelEdit").prop("hidden", true);
    renderExpenses();
    $("#description").trigger("focus");
  });

  $("#expenseList").on("click", ".edit-button", function () {
    const transaction = expenses.find((expense) => expense.id === $(this).attr("data-id"));
    if (!transaction) {
      return;
    }

    editingTransactionId = transaction.id;
    $("#transactionType").val(transaction.type);
    $("#description").val(transaction.description);
    $("#amount").val(transaction.amount);
    $("#category").val(transaction.category);
    $("#date").val(transaction.date);
    $("#transactionFormTitle").text("Edit transaction");
    $("#transactionSubmit").html("Save changes <span>→</span>");
    $("#cancelEdit").prop("hidden", false);
    $("#formMessage").text("");
    $("#description").trigger("focus");
  });

  $("#cancelEdit").on("click", function () {
    editingTransactionId = null;
    $("#expenseForm")[0].reset();
    $("#transactionType").val("expense");
    $("#date").val(localDateString(new Date()));
    $("#transactionFormTitle").text("Add a transaction");
    $("#transactionSubmit").html("Add transaction <span>→</span>");
    $(this).prop("hidden", true);
    $("#formMessage").text("");
  });

  $("#expenseList").on("click", ".delete-button", function () {
    const id = $(this).attr("data-id");
    const previousExpenses = expenses;
    expenses = expenses.filter((expense) => expense.id !== id);

    if (!saveExpenses()) {
      expenses = previousExpenses;
      return;
    }

    if (editingTransactionId === id) {
      $("#cancelEdit").trigger("click");
    }

    renderExpenses();
  });

  $("#budgetForm").on("submit", function (event) {
    event.preventDefault();
    $("#budgetMessage").text("");
    const category = $("#budgetCategory").val();
    const limit = Number($("#budgetLimit").val());

    if (!categories.includes(category) || !Number.isFinite(limit) || limit <= 0) {
      $("#budgetMessage").text("Choose a category and enter a positive monthly limit.");
      return;
    }

    const previousBudgets = { ...budgets };
    budgets[category] = limit;
    if (!saveBudgets()) {
      budgets = previousBudgets;
      return;
    }

    this.reset();
    $("#budgetCategory").val(category);
    renderBudgets();
  });

  $("#budgetList").on("click", ".budget-remove", function () {
    const category = $(this).attr("data-category");
    const previousBudgets = { ...budgets };
    delete budgets[category];

    if (!saveBudgets()) {
      budgets = previousBudgets;
      return;
    }

    renderBudgets();
  });

  $("#searchInput, #filterCategory, #filterType").on("input change", renderExpenses);

  renderExpenses();
});