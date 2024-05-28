const express = require("express");
const path = require("path"); //needed for functions having to do with file paths
const { MongoClient, ObjectId } = require("mongodb"); //import MongoClient class from mongodb driver

//DATABASE SETUP
const dbUrl = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(dbUrl); //create a MongoDB client

const app = express();
const port = process.env.PORT || "8888";

//Settings for Express app
app.set("views", path.join(__dirname, "views")); //setting for "views" is set to path: __dirname/views
app.set("view engine", "pug");

//Set up folder for static files (e.g. CSS, client-side JS, images)
app.use(express.static(path.join(__dirname, "public")));

//SET UP PAGE ROUTES
app.get("/", async (request, response) => {
  let links = await getLinks();
  //console.log(links);
  response.render("index", { title: "Home", menu: links });
});
app.get("/about", async (request, response) => {
  let links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})

//NEW SETTINGS (typically, I'd add this with other settings)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//ADMIN PAGES
app.get("/admin/menu", async (request, response) => {
  let links = await getLinks();
  response.render("menu-list", { title: "Administer menu links", menu: links });
})
//CREATE PAGE AND FORM PROCESSING PATH
app.get("/admin/menu/add", async (request, response) => {
  let links = await getLinks();
  response.render("menu-add", { title: "Add link", menu: links })
})
app.post("/admin/menu/add/submit", async (request, response) => {
  //weight=1&path=/about&name=About
  //For POST forms, data gets submitted in the body (request.body) and you can get each field's data using request.body.<field_name>
  let wgt = request.body.weight;
  let href = request.body.path;
  let text = request.body.name;

  let newLink = {
    weight: parseInt(wgt),
    path: href,
    name: text
  };
  await addLink(newLink);
  response.redirect("/admin/menu"); //when done, redirect back to /admin/menu
})
//DELETE FORM SUBMISSION PATH
app.get("/admin/menu/delete", async (request, response) => {
  //GET form data is submitted in a query string in the URL
  //To access it, use request.query.<field_name>
  await deleteLink(request.query.linkId);
  response.redirect("/admin/menu");
})


// EDIT PAGE AND FORM PROCESSING PATH

//app.get("/admin/menu/edit", async(request, response) => {
  //const _id = request.query.id;
  //const link = await getLinkById(_id); // Fetch the link from the database
  //response.render("menu-edit", { title: "Edit link", link });
  //});

app.get("/admin/menu/edit", async (request, response) => {
  let id = request.query.linkId;
  let link = await getLinkById(id);
  let links = await getLinks();
  if (link) {
    response.render("menu-edit", { title: "Edit link", link: link, menu: links });
  }
});

app.post("/admin/menu/edit/submit", async (request, response) => {
  //weight=1&path=/about&name=About
  //For POST forms, data gets submitted in the body (request.body) and you can get each field's data using request.body.<field_name>
  let wgt = request.body.weight;
  let href = request.body.path;
  let text = request.body.name;

  let newLink = {
    weight: parseInt(wgt),
    path: href,
    name: text
  };
  await editLink(request.query.linkId, newLink);
  response.redirect("/admin/menu"); //when done, redirect back to /admin/menu
})


//MONGODB FUNCTIONS
async function connection() {
  db = client.db("testdb"); //select "testdb" to use
  return db;
}

//Function to select all documents in the menuLinks collection.
async function getLinks() {
  db = await connection();
  let results = db.collection("menuLinks").find({}); //select all documents in menuLinks
  return await results.toArray(); //convert results to an array
}

//Function to insert one document into menuLinks collection.
async function addLink(newLinkDoc) {
  db = await connection();
  let status = await db.collection("menuLinks").insertOne(newLinkDoc);
  //you can do something with status to check if ok
  console.log("link added");
}

//Function to delete one document from menuLinks collection by _id.
async function deleteLink(id) {
  let idFilter = { _id: new ObjectId(id) };
  db = await connection();
  let result = await db.collection("menuLinks").deleteOne(idFilter);
  if (result.deletedCount == 1)
    console.log("link deleted");
}

//Function to update one document from menuLinks collection by _id.
async function editLink(id, link) {
  let idFilter = { _id: new ObjectId(id) };
  db = await connection();
  let result = await db.collection("menuLinks").updateOne(idFilter, { $set: link });
  if (result.modifiedCount == 1) {
    console.log("Link updated successfully");
  } else {
    console.log("No link was updated");
  }
}