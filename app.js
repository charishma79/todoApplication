const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
//API 1
//Returns a list of all todos whose status is 'TO DO'

const convertTodoDbObject = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { status, search_q, priority, category } = request.query;

  switch (true) {
    //*Scenario 1 has status property
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    /*----scenario 2--------*/
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                SELECT * FROM todo WHERE priority='${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    /*----scenario 3 -------*/
    case hasPriorityAndStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE priority='${priority}' AND status = '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    /*----scenario 4 -------*/
    case hasSearch(request.query):
      getTodoQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
      break;
    /*----scenario 5 -------*/
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE category='${category}' AND status = '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    /*------scenario 6----*/
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                    SELECT * FROM todo WHERE category='${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    /*---scenario 7----*/
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => convertTodoDbObject(eachItem)));
  }
});

//API 2
//Returns a specific todo based on the todo ID
//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSIngleTodoQuery = `
        SELECT * FROM todo WHERE id='${todoId}';`;
  const getSingleQueryResponse = await db.get(getSIngleTodoQuery);
  response.send(convertTodoDbObject(getSingleQueryResponse));
});

//Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12
//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const dateQuery = `
        SELECT * FROM todo WHERE due_date='${newDate}';`;
    const dateQueryResponse = await db.all(dateQuery);
    response.send(
      dateQueryResponse.map((eachItem) => convertTodoDbObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create a todo in the todo table,
//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                INSERT INTO
                    todo (id, todo,priority, status,category, due_date)
                VALUES
                    ('${id}', '${todo}','${priority}', '${status}','${category}','${postNewDueDate}');`;
          await db.run(postTodoQuery);
          //console.log(responseResult);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//Updates the details of a specific todo based on the todo ID
//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${newDueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//Deletes a todo from the todo table based on the todo ID
//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
