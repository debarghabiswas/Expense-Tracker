# Pennywise Expense Tracker

A simple, responsive expense tracker for recording everyday spending. Add expenses, organize them by category, and keep an eye on your totals in a clean dark-mode interface.

## Features

- Add, edit, and delete income and expense transactions
- View total income, total expenses, net balance, this month's spending, and transaction count
- Set monthly spending limits by category and track remaining or over-budget amounts
- Visualize spending by category and monthly totals for the last six months
- Search expenses by description and filter by category
- Delete expenses when they are no longer needed
- Save transactions and budgets in your browser with `localStorage`
- Display amounts in Indian Rupees (INR)
- Responsive layout for desktop and mobile screens

## Tech Stack

- HTML5
- CSS3
- JavaScript
- jQuery 3.7.1

## Getting Started

No build tools or package installation are required.

1. Download or clone this repository.
2. Keep `index.html`, `style.css`, and `app.js` in the same folder.
3. Open `index.html` in a modern web browser.

The page loads jQuery from the jQuery CDN, so an internet connection is needed for that dependency. The app itself stores expense data in your browser.

## Usage

1. Choose whether the transaction is income or an expense.
2. Enter a description and amount, then select a category and date.
3. Select **Add transaction**. Use **Edit** or **×** on a transaction to update or delete it.
4. Set a category and monthly limit in the **Category budgets** section.
5. Review the dashboard, charts, remaining budget, and use search or filters to find transactions.

## Data and Privacy

Transactions and budgets are stored locally in the current browser using `localStorage`. They are not sent to a server. Clearing browser data or switching browsers/devices may remove or hide saved data.

## Project Structure

```text
.
├── index.html   # App structure and form
├── style.css    # Dark theme and responsive layout
├── app.js       # Expense handling, summaries, and local storage
└── README.md    # Project documentation
```

## License

No license has been specified yet. Add a `LICENSE` file before distributing the project under a particular open-source license.
