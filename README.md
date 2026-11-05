# Pennywise Expense Tracker

A simple, responsive expense tracker for recording everyday spending. Add expenses, organize them by category, and keep an eye on your totals in a clean dark-mode interface.

## Features

- Add expenses with a description, amount, category, and date
- View total expenses, this month's spending, and transaction count
- Search expenses by description and filter by category
- Delete expenses when they are no longer needed
- Save expenses in your browser with `localStorage`
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

1. Enter a description and amount.
2. Select a category and date.
3. Select **Add expense**.
4. Review totals and use search or category filters to find expenses.
5. Select the **×** button next to an expense to delete it.

## Data and Privacy

Expenses are stored locally in the current browser using `localStorage`. They are not sent to a server. Clearing browser data or switching browsers/devices may remove or hide saved expenses.

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
