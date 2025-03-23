const express = require("express");
const subjectModel = require("../model/subjectModel")
const router = express.Router();

router.get("/", async (req,res)=>{
    try {
        const subjects = await subjectModel.find()
        res.status(201).json(subjects)
    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
})

router.post("/add", async (req,res) => {
    const newSubject = subjectModel({
        subject:req.body.subject
    })
    try {
        const subject = await newSubject.save()
        res.status(201).json(subject)
    } catch (err) {
        res.status(400).send(err)
    }  
})

router.delete("/:subjectid", async (req,res) => {
    try {
        const deleteSubject = await subjectModel.findByIdAndDelete({_id:req.params.subjectid})
        res.status(201).json(deleteSubject)
    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
})

router.put("/:subjectid", async (req,res) => {
    try {
        console.log(req.body);
        const updateSubject = await subjectModel.findByIdAndUpdate({_id:req.params.subjectid},req.body)
        res.status(201).json(updateSubject)
        console.log(updateSubject);
    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
})



module.exports = router