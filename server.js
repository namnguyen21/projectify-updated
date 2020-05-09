const express = require("express");
const socket = require("socket.io");
const mongoose = require("mongoose");
const asyncHelper = require("async");
const path = require("path");
require("dotenv").config();

const Projects = require("./models/ProjectSchema");
const Users = require("./models/UserSchema");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "client/build")));

const server = app.listen(process.env.PORT || 3002, () => {
  console.log(`server is running on port 3002`);
});

const io = socket(server);

//create separate chat rooms using project id
io.on("connection", (socket) => {
  socket.on("room", (room) => {
    socket.join(room);
    socket.in(room).on("SEND_MESSAGE", (message) => {
      io.sockets.emit("RECEIVE_MESSAGE", message);
    });
    socket.in(room).on("TASK_CHANGE", (data) => {
      io.sockets.emit("UPDATE_PROJECT", data);
    });
  });
});

// //catch all for react router

//get all projects associated to user
app.get("/:userId/project/all", (req, res) => {
  Projects.find({ users: { $all: [req.params.userId] } }, (err, data) => {
    if (err) throw err;

    if (data) {
      res.json(data);
    }
  });
});

//get specific project
app.get("/project/:id", (req, res) => {
  Projects.findById(req.params.id, (err, data) => {
    if (err) throw err;
    if (data) {
      res.json(data);
    }
  });
});

app.post("/project/new", (req, res) => {
  Projects.create(req.body, (err, data) => {
    if (err) {
      res.send(err);
    }
    if (data) {
      res.send(data);
    }
  });
});

//insert new task to a specific project
app.put("/project/:id/task/new", (req, res) => {
  Projects.findByIdAndUpdate(
    { _id: req.params.id },
    { $push: { tasks: req.body } },
    (err, data) => {
      if (err) throw err;
      if (data) {
        res.sendStatus(200);
      }
    }
  );
});

app.put("/project/:id/chat", (req, res) => {
  console.log(req.body);
  console.log("-----");
  Projects.findByIdAndUpdate(
    {
      _id: req.params.id,
    },
    { $push: { chat: req.body } },
    (err, data) => {
      if (err) throw err;
      if (data) res.sendStatus(200);
    }
  );
});

//edit task status

app.put("/project/:id/task/edit/:taskId", (req, res) => {
  Projects.findOneAndUpdate(
    {
      _id: req.params.id,
      "tasks._id": req.params.taskId,
    },
    {
      $set: {
        "tasks.$.status": req.body.status,
      },
    },
    (err, data) => {
      if (err) throw err;
      if (data) {
        res.sendStatus(200);
      }
    }
  );
});

app.post("/user/new", (req, res) => {
  Users.findOne({ _id: req.body._id }, (err, user) => {
    if (err) {
      throw err;
    }
    if (user) {
      res.json(user);
    } else {
      Users.create(req.body, (error, newUser) => {
        if (error) {
          throw error;
        }
        if (newUser) {
          res.json(newUser);
        }
      });
    }
  });
});

//request permission to view/edit project
app.put("/project/request/permission", (req, res) => {
  const { _id, users, projectId, notification, requesterId } = req.body;

  //update each project user with notification with async library
  asyncHelper.eachSeries(users, (id, done) => {
    Users.update(
      { _id: id },
      {
        $push: {
          notifications: {
            _id,
            projectId,
            notification,
            requesterId,
          },
        },
      },
      done
    ),
      (err) => {
        if (err) throw err;
      };
  });
});

app.put("/accept/request/:id", (req, res) => {
  const { id: projectID } = req.params;
  const { userId, requesterID, notificationID } = req.body;

  Projects.findOneAndUpdate(
    { _id: projectID },
    { $push: { users: requesterID } }
  ).then((res) => console.log(res));
  Users.findOneAndUpdate(
    { _id: userId },
    { $pull: { notifications: { _id: notificationID } } }
  ).then((response) => {
    res.json(response);
  });
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});
