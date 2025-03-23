const express = require("express")
const playListModel = require('../model/playListModel')
const quizModel = require('../model/quizModel')
const UserModel = require("../model/UserModel")
const router = express.Router()
const multer = require("multer")

const upload = multer({ dest: "uploads"})

router.post("/" , upload.any(), async (req,res)=>{
    const quizarr = []
    for(let item in req.body){
        if(item !== "name" && item !=="subject")
            quizarr.push(req.body[item])
    }
    const newplayList = new playListModel({
        name:req.body.name,
        image:req.files[0].path,
        subject:req.body.subject,
        quizziz: quizarr,
        creator: req.userInfo._id
    })

    try {
        const createdPlayList = await newplayList.save()
        res.status(201).json(createdPlayList)
    } catch (err) {
        res.status(400).json(err)
    }
})

router.get("/", async (req,res) => {
    try {
        const playLists = await playListModel.find().lean()
        for(let pl of playLists){
            const creator = await UserModel.findOne({_id:pl.creator})
            pl.creator = creator
            pl.quizziz = await Promise.all( pl.quizziz.map( async (quiz)=>{
                const quizInfo = await quizModel.findOne({_id:quiz})
                if(quizInfo) 
                    return quizInfo
            }))
            pl.quizziz = pl.quizziz.filter(quiz => quiz)
        }
        res.status(201).json(playLists)
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
})

router.get("/admin", async (req,res) => {   
    try {
        const playLists = await playListModel.find().lean()
        for(let pl of playLists){
            const creator = await UserModel.findOne({_id:pl.creator})
            pl.creator = creator
            pl.quizziz = await Promise.all( pl.quizziz.map( async (quiz)=>{
                const quizInfo = await quizModel.findOne({_id:quiz})
                if(quizInfo) 
                    return quizInfo
            }))
            pl.quizziz = pl.quizziz.filter(quiz => quiz)
        }
        res.status(201).json(playLists)
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
})


router.delete("/:plId",async (req,res)=>{
    try {
        const deletePL = await playListModel.deleteOne({_id:req.params.plId})
        res.status(201).json(deletePL)
    } catch (err) {
        console.log(err,55);
        res.status(400).json(err)
    }
})

router.put("/:plId" , upload.any(), async (req,res)=>{
    const quizarr = []
    for(let item in req.body){
        if(item !== "name" && item !=="subject" && item!=="image")
            quizarr.push(req.body[item])
    }
    
    const newplayList = {
        name:req.body.name,
        image:req.files.length>0?req.files[0].path:req.body.image ,
        subject:req.body.subject,
        quizziz: quizarr,
        creator: req.userInfo._id
    }

    try {
        const UpdatePlayList = await playListModel.findOneAndUpdate({_id:req.params.plId},newplayList)
        res.status(201).json(UpdatePlayList)
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
})


router.get("/:plId",async (req,res)=>{
    try {
        const pl = await playListModel.findOne({_id:req.params.plId})
        res.status(201).json(pl)
    } catch (err) {
        console.log(err,85);
        res.status(400).json(err)
    }
})


module.exports = router