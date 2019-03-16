"use strict";

// import chai and chaihttp libraries
const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
chai.use(chaiHttp);

const { runServer, app, closeServer } = require("../server");
const { BlogPost } = require("../models");

//import mongoose
const mongoose = require("mongoose");

//import faker library for fake names
const faker = require("faker");

//create functions for seeding datbase
const seedDatabase = () => {
  var seedData = [];
  for (var i = 0; i < 10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.words(),
      content: faker.lorem.text()
    });
  }
  return BlogPost.insertMany(seedData);
};

//tear down database after each function
const tearDown = () => {
  console.log("Tearing down test db");
  return mongoose.connection.dropDatabase();
};

describe("integration tests with mongoose", function() {
  //establish connection to db with before hook
  before(function() {
    return runServer(process.env.TEST_DATABASE_URL);
  });

  //set up db with beforeEach hook
  beforeEach(function() {
    return seedDatabase();
  });

  //tear down db with afterEach hook
  afterEach(function() {
    return tearDown();
  });
  //disconnect from db with after hook

  after(function() {
    return closeServer();
  });

  it("test get endpoint", function() {
    return chai
      .request(app)
      .get("/posts")
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.length).to.equal(10);
      })
      .catch(err => {
        console.log(err.message);
      });
  });

  it("test post endpoint", function() {
    const newPost = {
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.words(),
      content: faker.lorem.text()
    };
    return chai
      .request(app)
      .post("/posts")
      .send(newPost)
      .then(res => {
        expect(res).to.have.status(201);
        expect(res.body.title).to.equal(newPost.title);
        expect(res.body.author).to.equal(
          `${newPost.author.firstName} ${newPost.author.lastName}`
        );
        expect(res.body.content).to.equal(newPost.content);
      });
  });

  it("test put endpoint", function() {
    return BlogPost.findOne().then(blog => {
      var editedPost = {
        title: "updated title",
        author: "updated author",
        content: "updated content"
      };
      Object.assign(editedPost, { id: blog.id });
      console.log("editedPost", editedPost);
      return chai
        .request(app)
        .put(`/posts/${editedPost.id}`)
        .send(editedPost)
        .then(res => {
          expect(res).to.have.status(204);
          return BlogPost.findOne({ _id: editedPost.id }).then(updatedPost => {
            expect(updatedPost.title).to.equal(editedPost.title);
          });
        });
    });
  });

  it("test delete endpoint", function() {
    return BlogPost.findOne().then(blog => {
      return chai
        .request(app)
        .delete(`/posts/${blog.id}`)
        .then(res => {
          expect(res).to.have.status(204);
          //   expect(res.body).to.include("message");
          //   return BlogPost.find().then(allPosts => {
          //     console.log("allPosts", allPosts.body);
          //     expect(allPosts.body.length).to.equal(9);
          //   });
        });
    });
  });
});
