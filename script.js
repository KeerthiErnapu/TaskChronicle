// Import firebase-admin
const admin = require("firebase-admin");
const express=require('express');
const app1=express();
const path=require('path');
const nodemailer = require('nodemailer');
const functions = require('firebase-functions');
const bodyParser = require('body-parser');
const port=5000;
app1.use(bodyParser.urlencoded({ extended: true }));
app1.use(bodyParser.json());
app1.use(express.static(path.join(__dirname, 'public')));
app1.use(express.urlencoded({ extended: true }));
app1.use(express.json());
// Initialize firebase-admin for server-side tasks
const { initializeApp }=require("firebase/app");
const { getFirestore, query, where, getDocs, addDoc } = require('firebase-admin/firestore');
const serviceAccount = require("./key1.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://login-database-ede49.firebaseio.com"
});
const db = getFirestore();
// Import firebase
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
const { getAnalytics ,collection}=require("firebase/analytics");
const firebaseConfig = {
  apiKey: "AIzaSyD_-Na9PwMrK3egCAM3NXHNz-DuoLP2pr8",
  authDomain: "login-database-ede49.firebaseapp.com",
  projectId: "login-database-ede49",
  storageBucket: "login-database-ede49.appspot.com",
  messagingSenderId: "1089046711010",
  appId: "1:1089046711010:web:2acd5836b971853f7fecbb",
  measurementId: "G-VSZ886BX43"
};
const app = initializeApp(firebaseConfig);
const{getAuth,sendPasswordResetEmail, createUserWithEmailAndPassword,signInWithEmailAndPassword,fetchSignInMethodsForEmail} =require("firebase/auth");
const auth = getAuth(app);
app1.get("/signup", function (req, res) {
  res.sendFile(__dirname + "/public/" + "signup.html");
});
app1.get("/todo", function (req, res) {
  res.sendFile(__dirname + "/public/" + "todolist.html");
});
app1.get("/login",function(req,res){
  res.sendFile(__dirname+"/public/"+"login.html");
});
app1.get("/mainpage",function(req,res){
  res.sendFile(__dirname+"/public/"+"index.html");
})
app1.get("/forgot-password", function(req, res) {
  res.sendFile(__dirname + "/public/" + "forgot-password.html");
});
app1.get('/favicon.ico', (req, res) => res.status(204));
app1.get('/phonenum',function(req,res){
  res.sendFile(__dirname+'/public/'+"phoneverify.html")
})
app1.post('/forgotpassword', (req, res) => {
  try {
    const email = req.body.email558;
    sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log("password reset link sent");
        res.json({ success: true, message: "If you have registered, an email will be sent to your provided email address." });
      })
      .catch((error) => {
        var errorMessage = error.message;
        console.log(errorMessage);
        res.json({ success: false, error: errorMessage });
      });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.json({ success: false, error: "Error sending password reset email. Please try again later." });
  }
});
app1.post('/signupsubmit', async (req, res) => {
  const em1 = req.body.email577;
  const pwd1 = req.body.pwd1;

  try {
      // Check if email is already registere

      // Create user with provided email and password
      const userCredential = await createUserWithEmailAndPassword(auth, em1, pwd1);
      var user = userCredential.user;
      res.json({ success: true });
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Email is already registered
      res.status(400).json({ success: false, error: 'Account already exists. Please use another email or log in.' });
  } else {
      // Handle other errors
      var errorMessage = error.message;
      res.status(500).json({ success: false, error: errorMessage });
  }
  }
});
app1.get('/tasks', async (req, res) => {
  try {
    // Ensure user is authenticated and get the email
    const userEmail = auth.currentUser ? auth.currentUser.email : null;    
    if (!userEmail) {
      return res.status(400).send('Email parameter is required log in again!');
    }

    // Query user document
    const userRef = db.collection('userdemo').doc(userEmail);
    const userSnapshot = await userRef.get();

    // Check if user exists
    if (!userSnapshot.exists) {
      return res.status(404).send('User not found');
    }

    // Get tasks array from user document
    const userData = userSnapshot.data();
    const tasks = userData.tasks || []; // Default to empty array if tasks field doesn't exist

    // Send tasks as JSON response
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Internal Server Error');
  }
});
app1.post('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.json({ success: false, error: err });
      }
      res.json({ success: true });
  });
});


app1.post('/addTask', async (req, res) => {
  try {
    const { task, dueDate} = req.body;
    const email=auth.currentUser.email;
    const taskId = generateTaskId();
    
    const lastSent = new Date();
lastSent.setDate(lastSent.getDate() - 1); // Subtract one day
const lastSentDate = lastSent.toISOString().split('T')[0];;
console.log(lastSentDate);// Convert to ISO format 
    const completed="No";
    // Reference to the user's document
    const userDocRef = admin.firestore().collection('userdemo').doc(email);

    // Check if the user document exists
    const userDoc = await userDocRef.get();
    const newTask1 = { taskId, task, dueDate, lastSentDate,completed};
    if (userDoc.exists) {
      // If the document exists, update the tasks array
      await userDocRef.update({
        tasks: admin.firestore.FieldValue.arrayUnion(newTask1)
      });
    } else {
      // If the document doesn't exist, create a new one
      await userDocRef.set({
        email: email,
        tasks: [{ task: task, dueDate: dueDate,lastSentDate,completed}]
      });
    }

    // Get updated tasks and send them back to the client
    const updatedUserDoc = await userDocRef.get();
    const updatedTasks = updatedUserDoc.data().tasks;
    const newTask = updatedTasks.find(t => t.task === task && t.dueDate === dueDate);
    res.status(200).json({ success: true, task:newTask  });
  } catch (error) {
    console.error("Error adding task: ", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Add a new route to fetch tasks
app1.post('/loginsubmit',(req,res)=>{
  const em2=req.body.em2;
  const pwd2=req.body.pwd2;
  signInWithEmailAndPassword(auth,em2, pwd2)
  .then((userCredential) => {
    // Signed in
    var user = userCredential.user;
    res.json({ success: true });
    // ...
  })
  .catch((error) => {
    if(error.code='auth/invalid-credential'){
      res.status(400).json({ success: false, error: 'Incorrect username or password' });
  } else {
      // Handle other errors
      var errorMessage = error.message;
      res.status(500).json({ success: false, error: errorMessage });
  }
})

});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '21pa1a0577@vishnu.edu.in', // Update with your Gmail email address
    pass: 'Navodayan@08' // Update with your Gmail password
  }
});
// Verify the transporter and start sending reminders
transporter.verify(function(error, success) {
  if (error) {
    console.error('Error verifying transporter:', error);
  } else {
    console.log('Transporter is ready');
    // Start sending email reminders
    sendEmailReminders();
    // Set interval to run sendEmailReminders every hour
    setInterval(sendEmailReminders, 3600000);
  }
});
// Function to get the current date as a string in 'YYYY-MM-DD' format
function getCurrentDate() {
  const now = new Date();
  return now;
}

// Function to send reminder emails
async function sendEmailReminders() {
  try {
    const today = getCurrentDate();
    today.setHours(0, 0, 0, 0);
    const usersSnapshot = await admin.firestore().collection('userdemo').get();

    // Iterate over each user
    usersSnapshot.forEach(async (userSnapshot) => {
      const userData = userSnapshot.data();
      const userEmail = userData.email;
      const userTasks = userData.tasks;

      // Iterate over each task for the user
      for (const task of userTasks) {
        const taskName = task.task;
        const taskId=task.taskId;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const Completed=task.completed;
        const lastSentDate = new Date(task.lastSentDate);
        console.log(lastSentDate);
        console.log(today);

        // Check if the task is due in 2 or fewer days and reminder hasn't been sent today
        const twoDaysAhead = new Date();
        twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);

        if (dueDate >= today && dueDate <= twoDaysAhead && lastSentDate < today && Completed.toLowerCase() === 'no') {
            await sendReminderEmail(taskName, dueDate, userEmail, taskId);
        }
        else{
          console.log('hel');
        }
      
        
      }

      // Update the tasks array for the user
      await admin.firestore().collection('userdemo').doc(userSnapshot.id).update({ tasks: userTasks });
    });
  } catch (error) {
    console.error('Error sending email reminders:', error);
  }
}
// Function to send individual reminder email
async function sendReminderEmail(taskName, dueDate, userEmail,taskId) {
  const mailOptions = {
    from: '21pa1a0577@vishnu.edu.in',
    to: userEmail,
    subject: 'Reminder!',
    text: `Your task "${taskName}" is due on ${dueDate.toDateString()}. Don't forget!`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reminder email sent for task:', taskName);
    const userDocRef = admin.firestore().collection('userdemo').doc(userEmail);

// Get the current user document
await admin.firestore().runTransaction(async (transaction) => {
  const userDocSnapshot = await transaction.get(userDocRef);
  if (!userDocSnapshot.exists) {
    console.error(`User document does not exist for email: ${userEmail}`);
    return;
  }
  let tasks = userDocSnapshot.data().tasks;
  const index = tasks.findIndex(task => task.taskId === taskId);
  if (index !== -1) {
    const currentDate = new Date().toISOString().split('T')[0];;
    tasks[index].lastSentDate = currentDate;
    
    
    transaction.update(userDocRef, { tasks: tasks });
    console.log(`Last sent date updated for task with taskId: ${taskId}`);
  } else {
    console.error(`Task with taskId ${taskId} not found for user ${userEmail}`);
  }
});
} catch (error) {
console.error('Error sending reminder email:', error);
}
}

const generateTaskId = () => {
  // Generate a random 10-character alphanumeric string
  return  Math.random().toString(36).substr(2, 10);

  // Ensure taskId is a non-empty string
};
// Edit a task
app1.put('/editTask', async (req, res) => {
  try {
    const { taskId, task,dueDate } = req.body; // Extract taskId and task from the request body

    // Reference to the user's document
    const email=auth.currentUser.email;
    const userDocRef = admin.firestore().collection('userdemo').doc(email);

    // Get the current tasks array
    const userDoc = await userDocRef.get();
    let tasks = userDoc.data().tasks;

    // Find the index of the task to update
    const index = tasks.findIndex(t => t.taskId === taskId);

    if (index !== -1) {
      // Update the task at the found index
      tasks[index].task = task;
      tasks[index].dueDate = dueDate;

      // Update the tasks array in Firestore
      await userDocRef.update({ tasks });

      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a task
app1.delete('/deleteTask', async (req, res) => {
  try {
      const { taskId } = req.body; // Extract email and taskId from the request body
      const email=auth.currentUser.email;
      // Reference to the user's document
      const userDocRef = admin.firestore().collection('userdemo').doc(email);

      // Get the current tasks array
      const userDoc = await userDocRef.get();
      let tasks = userDoc.data().tasks;

      // Find the index of the task with the given taskId
      const index = tasks.findIndex(task => task.taskId === taskId);

      // If the task is found, remove it from the tasks array
      if (index !== -1) {
        tasks.splice(index, 1);
      } else {
        // If the task is not found, send a failure response
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      // Update the tasks array in Firestore without the deleted task
      await userDocRef.update({ tasks });

      // Send a success response
      res.json({ success: true });
  } catch (error) {
      // If there's an error, send an error response
      console.error('Error deleting task:', error);
      res.status(500).json({ success: false, error: error.message });
  }
});
// Update task status
app1.put('/updateTaskStatus', async (req, res) => {
  try {
    const { taskId,completed } = req.body; // Extract taskId and status from the request body

    // Reference to the user's document
    const email = auth.currentUser.email;
    const userDocRef = admin.firestore().collection('userdemo').doc(email);

    // Get the current tasks array
    const userDoc = await userDocRef.get();
    let tasks = userDoc.data().tasks;

    // Find the index of the task to update
    const index = tasks.findIndex(t => t.taskId === taskId);

    if (index !== -1) {
      tasks[index].completed=completed?"Yes":"No";
      await userDocRef.update({ tasks: tasks });
      res.json({ success: true });
    } else {
      // Task not found
      res.json({ success: false, error: 'Task not found' });
    }
  } catch (error) {
    // Error handling
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app1.listen(port, () =>{
  console.log("listening on port");
});
