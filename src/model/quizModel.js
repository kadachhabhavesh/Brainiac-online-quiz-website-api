const mongoose = require("mongoose");
const UserModel = require("../model/UserModel");
const startTimeSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    min: 2000,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59,
  },
});

const optionSchema = new mongoose.Schema({
  option: {
    type: String,
    required: true,
    trim: true,
  },
  isTrue: {
    type: Boolean,
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: false,
  },
  explanation: {
    type: String,
    required: false,
    trim: true,
  },
  marks: {
    type: Number,
    required: true,
  },
  options: {
    type: [optionSchema],
    required: true,
  },
});

const quizSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim:true
  },
  description: {
    type: String,
    required: true,
    trim:true
  },
  image: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  difficultylevel: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  starttime: {
    type: startTimeSchema,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim:true
  },
  showresult: {
    type: Boolean,
    required: true,
  },
  private: {
    type: Boolean,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  creator: {
    type: String,
    required: true,
    trim:true
  },
  likes: {
    type: Number,
    required: true,
    default: 0,
  },
  plays: {
    type: Number,
    required: true,
    default: 0,
  },
  code: {
    type: String,
    required: true,
    unique:true
  },
  createDate:{
    type: Date,
    required: false,
    default: Date.now
  },
  questions: {
    type: [questionSchema],
    required: true,
  },
});

module.exports = mongoose.model("Quiz",quizSchema)