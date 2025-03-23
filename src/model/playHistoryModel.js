const mongoose = require('mongoose')

const startTimeSchema = new mongoose.Schema({
    year: {
      type: Number,
      requiredd: true,
      min: 2000,
    },
    month: {
      type: Number,
      requiredd: true,
      min: 1,
      max: 12,
    },
    day: {
      type: Number,
      requiredd: true,
      min: 1,
      max: 31,
    },
    hour: {
      type: Number,
      requiredd: true,
      min: 0,
      max: 23,
    },
    minute: {
      type: Number,
      requiredd: true,
      min: 0,
      max: 59,
    },
});

const completiontTimeSchema = mongoose.Schema({
    min:{
        type:Number,
        required:true,
        min:0,
    },
    sec:{
        type: Number,
        required:true,
        min:0,
        max:59
    }
})

const queAndAnsSchema = mongoose.Schema({
    questionid:{
        type:String,
        required:true,
    },
    optionid:{
        type:String
    },
    marks:{
        type:Number,
        required:true,
    },
    isattempted:{
        type:Boolean,
        required:true,
    },
    iscorrect:{
        type:Boolean,
        required:true,
    }
})

const schema = mongoose.Schema({
    studentid:{
        type:String,
        required:true,
    },
    quizid:{
        type:String,
        required:true,
        trim:true
    },
    starttime:{
        type: startTimeSchema,
        required:true,
    },
    quizcompletiontime:{
        type: completiontTimeSchema,
        required:true,
    },
    queandans:{
        type:[queAndAnsSchema],
        required:true
    },
    totalmarks:{
        type:Number,
        require:true
    }
})


module.exports = mongoose.model("PlayHistory",schema)