//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
mongoose.connect('mongodb://localhost:27017/todolistDB',
{ useNewUrlParser: true, useUnifiedTopology: true }
);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name:'Welcome to your Todo list.'
});

const item2 = new Item({
  name:'Hit the + button to add a new item.'
});

const item3 = new Item({
  name:'<---Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res){

  Item.find({},function(err, fitems){//SAME//Item.find(function(err, fitems){
    if (fitems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully inserted Default Items');
        }
        res.redirect('/');
      });
    }
    else {
      res.render("list", {listTitle:'Today', newListItems:fitems});
    }
  });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });
  if (listName === 'Today') {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      res.redirect("/"+ listName);
    });
  }
});

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function(err, fitems){
      if (err) {
        console.log(err);
      }
      else {
        console.log(fitems.name + ' is deleted');
      }
    });
    res.redirect('/');
  }
  else {
    List.findOneAndUpdate({name:listName}, {$pull:{items:{_id:checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.get('/:customListName', function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}, function(err, foundList){
    if (!foundList) {
      const list = new List({
        name:customListName,
        items:defaultItems
      });
      list.save();
      res.redirect('/'+customListName);
    }
    else {
      res.render('list',{listTitle:foundList.name, newListItems:foundList.items});
    }
  });
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
