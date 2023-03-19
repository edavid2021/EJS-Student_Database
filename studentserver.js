//studentserver.js

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
//ejs
app.set('view engine', 'ejs');
//mongoose
const mongoose = require('mongoose');

app.use(express.static('./public'));

//connecting mongo through mongoose
mongoose.connect("mongodb+srv://edavid2021:Z23619905@cluster0.nva3dco.mongodb.net/?retryWrites=true&w=majority")

//schema
const studentSchema = new mongoose.Schema({
  _id: {
    required: true,
    type: Number
  },
  first_name: {
    required: true,
    type: String
  },
  last_name: {
    required: true,
    type: String
  },
  gpa: {
    required: true,
    type: String
  },
  enrolled: {
    required: true,
    type: String
  }
})

//model for the schema
const Model = mongoose.model("Students", studentSchema) //student or data


/**
 * posts student data into a .json file
 * @function POST_METHOD
 * @param {string} record_id - record id of student
 * @param {string} last_name - last name of student
 * @param {number} gpa - gpa of student
 * @param {boolean} enrolled - enrolled status of student
 * @returns {object} - returns a json object with record_id and message
 */
app.post('/students',async function(req, res) {
  var record_id = new Date().getTime();

  let flag = await Model.findOne({ first_name: req.body.first_name, last_name: req.body.last_name })
  if (flag) {   //if the data already exists
    return res.status(400).send("Student already exists"); //bad request
  }

//formatting for the data
  const data = new Model({
    _id: req.body.id,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    gpa: req.body.gpa,
    enrolled: req.body.enrolled
  })
  await data.save();
  console.log(data);

  var obj = {};
  obj.record_id = record_id;
  obj.first_name = req.body.first_name;
  obj.last_name = req.body.last_name;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled;

  return res.status(200).send("Successfully added student");
  
}); //end post method

/**
 * gets a student record file
 * @function GET_METHOD
 * @param {string} record_id - record id of student
 * @param {string} first_name - first name of student
 * @param {string} last_name - last name of student
 * @param {number} gpa - gpa of student
 * @param {boolean} enrolled - enrolled status of student
 * @returns {object} - returns a json object with record_id and message
 */
app.get('/students/:record_id', async function(req, res) {

  let student = await Model.findOne({ _id: req.params.record_id });
  console.log(student);
  res.status(200).send(student);
}); 

function readFiles(files,arr,res) {
  fname = files.pop();
  if (!fname)
    return;
  fs.readFile(fname, "utf8", function(err, data) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    } else {
      arr.push(JSON.parse(data));
      if (files.length == 0) {
        var obj = {};
        obj.students = arr;
        return res.status(200).send(obj);
      } else {
        readFiles(files,arr,res);
      }
    }
  });  
}

app.get('/students', function(req, res) {
  var obj = {};
  var arr = [];
  filesread = 0;

  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    }
    readFiles(files,[],res);
  });

});

/**
 * updates a student record file
 * @function PUT_METHOD
 * @param {string} record_id - record id of student
 * @param {string} first_name - first name of student
 * @param {string} last_name - last name of student
 * @param {number} gpa - gpa of student
 * @param {boolean} enrolled - enrolled status of student
 * @returns {object} - returns a json object with record_id and message
 */
app.put('/students/:record_id', function(req, res) {
  var record_id = req.params.record_id;
  var fname = "students/" + record_id + ".json";
  var rsp_obj = {};
  var obj = {};

  obj.record_id = record_id;
  obj.first_name = req.body.first_name;
  obj.last_name = req.body.last_name;
  obj.gpa = req.body.gpa;
  obj.enrolled = req.body.enrolled;

  var str = JSON.stringify(obj, null, 2);

  //check if file exists
  fs.stat(fname, function(err) {
    if(err == null) {

      //file exists
      fs.writeFile("students/" + record_id + ".json", str, function(err) {
        var rsp_obj = {};
        if(err) {
          rsp_obj.record_id = record_id;
          rsp_obj.message = 'error - unable to update resource';
          return res.status(200).send(rsp_obj);
        } else {
          rsp_obj.record_id = record_id;
          rsp_obj.message = 'successfully updated';
          return res.status(201).send(rsp_obj);
        }
      });
      
    } else {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    }

  });

}); //end put method

/**
 * deletes a student record
 * @function DELETE_METHOD
 * @param {string} record_id - record id of student
 * @param {string} first_name - first name of student
 * @param {string} last_name - last name of student
 * @param {number} gpa - gpa of student
 * @param {boolean} enrolled - enrolled status of student
 * @returns {object} - returns a json object with record_id and message
 */
app.delete('/students/:record_id', function(req, res) {
  var record_id = req.params.record_id;
  var fname = "students/" + record_id + ".json";

  fs.unlink(fname, function(err) {
    var rsp_obj = {};
    if (err) {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'record deleted';
      return res.status(200).send(rsp_obj);
    }
  });

}); //end delete method

//render addStudent.ejs page
app.get('/add', function (req, res) {
  res.render('addStudent');
});
//render updateStudent.ejs page
app.get('/update', function (req, res) {
  res.render('updateStudent');
});
//render deleteStudent.ejs page
app.get('/delete', function (req, res) {
  res.render('deleteStudent');
});
//render getStudent.ejs page
app.get('/get', function (req, res) {
  res.render('displayStudent');
});
//render listStudents.ejs page
app.get('/list', function (req, res) {
  res.render('listStudents');
});
//render index.ejs page
app.get('/', function (req, res) {
  res.render('index');
 });

app.listen(5678); //start the server
console.log('Server is running...');