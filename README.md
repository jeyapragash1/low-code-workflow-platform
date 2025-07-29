# Low-Code Workflow Automation Platform

This is a fully-featured low-code automation platform built as a portfolio project. It allows users to visually design, execute, and monitor complex workflows, including integrations with external services like Slack.

**[Link to Live Demo - You will get this after deployment]**

![Screenshot of the application]([Link to a screenshot you will take])

---

## Core Features

*   **Visual Workflow Designer:** An intuitive drag-and-drop interface using React Flow to design complex workflows with nodes and edges.
*   **Intelligent Workflow Engine:** A Node.js backend that correctly interprets the workflow graph, executing nodes in the proper sequence.
*   **Secure User Authentication:** A complete JWT-based authentication system with user registration, login, and protected routes.
*   **Real-World Integrations:** A configurable "Send Slack Message" node that makes real API calls.
*   **Configurable Nodes:** A dynamic settings panel that allows users to configure the properties of each node (e.g., labels, webhook URLs, messages).
*   **Execution Monitoring:** A detailed execution history panel showing the status and full logs for every workflow run.
*   **Persistent Storage:** All users, workflows, and execution logs are stored in a PostgreSQL database.

## Technology Stack

### Frontend
*   **React.js:** For building the user interface.
*   **React Flow:** The core library for the node-based editor.
*   **Axios:** For making API calls to the backend.
*   **Vite:** As the frontend build tool.

### Backend
*   **Node.js & Express.js:** For the RESTful API server.
*   **PostgreSQL:** As the primary relational database.
*   **JSON Web Tokens (JWT):** For securing endpoints.
*   **bcrypt:** For hashing user passwords.
*   **Axios:** For making outgoing API calls from the engine (e.g., to Slack).

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [Your GitHub Repository URL]
    cd workflow-platform
    ```

2.  **Setup Backend:**
    *   Navigate to the backend folder: `cd backend`
    *   Install dependencies: `npm install`
    *   Create a PostgreSQL database named `workflow_db`.
    *   Run the SQL commands in the `database.sql` file (You will create this file next).
    *   Create a `.env` file and add your database connection details and a `JWT_SECRET`.
    *   Start the server: `npm start`

3.  **Setup Frontend:**
    *   In a new terminal, navigate to the frontend folder: `cd frontend`
    *   Install dependencies: `npm install`
    *   Start the development server: `npm run dev`

4.  Open your browser to `http://localhost:5173`.

---
This project was built step-by-step by Jeyapragash, demonstrating skills in full-stack development, system architecture, and modern web technologies.
