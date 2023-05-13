var express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var cors = require('cors');

var app = express();

app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));


// mongo_db stup
mongoose.connect("mongodb://127.0.0.1:27017/test");

const exercises_schema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
})
const user_schema = new mongoose.Schema({
  username: String,
  count: Number,
  log:[exercises_schema]
});

const exercises_model = mongoose.model("exercises", exercises_schema);
const user_model = mongoose.model("users", user_schema);





// HOME PAGE
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



app.get("/api/users", async(req,res)=>{
  res.send(await user_model.find().select("username"))
});

app.post("/api/users",async (req,res)=>{
  
  const username = req.body.username;

  const user = new user_model({
    username: username,
    count: 0
  });

  await user.save();

  const obj = {
    username: user.username,
    _id: user._id
  }
  
  res.send(obj);
})

app.get("/api/users/:_id/logs",async (req,res)=>{

  console.log("\n \n")
  console.log(req.originalUrl,req.method)

  const{from, to, limit} = req.query;
  const _id = req.params._id;

  console.log(from,to,limit);

  const user = await user_model.findById(_id);
  delete user.__v;

  if(from != undefined){
    const from_date = new Date(from);
    user.log = user.log.filter(x=>{
      const xDate = new Date(x.date);

      if(xDate >= from_date){
        return x;
      }
    })
  }

  if(to != undefined){
    const to_date = new Date(to);
    user.log = user.log.filter(x=>{
      const xDate = new Date(x.date);

      if(xDate <= to_date){
        return x;
      }
    })
  }
  console.log(limit)
  if(limit != undefined){
    user.log = user.log.splice(0,limit);
  }



  console.log("USERS=>",user)
  res.send(user);

});




app.post("/api/users/:_id/exercises", async(req,res)=>{

  const { date, description,duration} = req.body;
  const _id = req.params._id;

  const exercises = new exercises_model({
    description ,
    date,
    duration: parseInt(duration)
  });

  if(!exercises.date){
    exercises.date = new Date().toDateString();
  }

  const update = await user_model.findByIdAndUpdate(_id,{$push:{"log": exercises}, $inc:{"count": 1}}).select("username");

  const res_obj =  {
    _id: update._id,
    username: update.username,
    description,
    date: new Date(exercises.date).toDateString(),
    duration: exercises.duration
  }
  res.json(res_obj)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
