# PC Saver  
### PostgreSQL Connection Pooler Web Application

PC Saver is a web-based PostgreSQL **connection pooler** that demonstrates **Operating System concepts** such as concurrency, synchronization, scheduling, and resource management — implemented using **Django**, **React**, and a custom **Python-based Pooler Engine**.

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React + Tailwind CSS |
| **Backend** | Django REST Framework |
| **Pooler Engine** | Python (multithreading + queue) |
| **Database** | PostgreSQL 16 |
| **Metrics & Config** | Central PostgreSQL + Django ORM |

---

## Project Setup

### Requirements
- PostgreSQL 16+
- Python 3.10+
- Node.js (latest stable)
- VS Code (recommended)

---

## How to Run

### **Backend Setup**

**Step 1:** Open the `backend/` folder in VS Code. 

Then run these commands in terminal:
```bash
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
````

**Step 2:** Open **PGAdmin** (installed with PostgreSQL).

> Note: You must know your PGAdmin password.

**Step 3:** Create a new database named:

```
pc_saver_db
```

**Step 4:** Create a `.env` file in the backend root.

**Step 5:** Run these commands:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Backend will run on:
**[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

---

### **Frontend Setup**

**Step 1:** Open the `frontend/` folder in VS Code.

**Step 2:** Run these commands:

```bash
npm install
npm audit fix
npm audit fix --force
npm run dev
```

Frontend will run on:
**[http://localhost:5173/](http://localhost:5173/)**

---

## Operating System Concepts Demonstrated

| OS Concept              | Implementation in PC Saver                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Concurrency**         | Multiple parallel API requests handled using `ThreadPoolExecutor`                       |
| **Synchronization**     | Locks & semaphores ensure safe pool access while managing active and queued connections |
| **Scheduling**          | Requests queued and dequeued in FIFO order, simulating process scheduling               |
| **Resource Management** | Connection pool limits concurrent connections (like CPU core limits)                    |
| **Deadlock Avoidance**  | Controlled queue timeout prevents indefinite blocking                                   |
| **Performance Metrics** | Tracks active connections, queue length, failures, and average wait time                |
| **Queuing System**      | Requests wait if pool is full — simulating process waiting queue                        |

---

## Pooler Engine Overview

### File: `pooler_engine/pool_manager.py`

Handles the **core connection pooling logic**:

* Manages active DB connections (`pool`)
* Manages queued requests (`queue.Queue`)
* Uses `ThreadPoolExecutor` for concurrent handling
* Returns `"try again later"` when both pool and queue are full
* Dequeues and executes next request when a connection is released

---

### File: `pooler_engine/metrics.py`

Tracks runtime metrics such as:

* Active connections
* Queued requests
* Failed connections
* Average queue wait time
* Total execution time

All metrics are stored centrally in PostgreSQL for analysis and comparison.

---

### File: `pooler_engine/db_client.py`

Handles **database query execution**:

* Creates a connection using `psycopg2`
* Executes sample SQL queries
* Returns execution result or error message
* Automatically closes the connection after use

---

### File: `pooler_engine/config.py`

Defines the **pool configuration**, dynamically fetched from the user’s database settings:

* `pool_size`
* `queue_size`
* `queue_timeout_ms`

Ensures the pool operates according to each user’s configuration.

---

## Backend API Modules

| API Endpoint                        | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `/test-with-pooler/<db_id>/`    | Executes test queries using the pooler engine        |
| `/test-without-pooler/<db_id>/` | Executes test queries directly (no pooling)          |
| `/compare-pooler/<db_id>/` | Compares metrics between pooler vs. direct execution |

---

## Frontend Overview

**Built using React + Tailwind**, featuring:

* **Public Homepage**

  * Overview of PC Saver
  * Live metrics:

    ```
    Users Registered: X  
    Databases Connected: X  
    Avg Pool Size: X  
    Avg Queue Size: X  
    Avg Timeout: X sec
    ```
  * Sections: Home | About | Features | Metrics | Concepts | Login | Register

* **Authenticated Dashboard**

  * Add / Manage databases
  * Configure pool settings
  * Test with or without pooler
  * Compare performance metrics visually

---

## Architecture Diagram (Conceptual)

```
        ┌──────────────────────────┐
        │        React UI          │
        │  (User Interaction Layer)│
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Django REST API Layer     │
        │ (Handles Auth, APIs, ORM) │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  Python Pooler Engine     │
        │ (Connection + Queue Mgmt) │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  PostgreSQL Database      │
        │ (Stores Data + Metrics)   │
        └──────────────────────────┘
```
---

## Summary

> **PC Saver** is not just a database pooler — it’s an **Operating System simulator** at the database level.
> It shows how modern systems manage limited resources efficiently through concurrency, synchronization, and scheduling.

---
