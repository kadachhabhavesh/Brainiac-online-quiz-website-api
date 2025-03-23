const express = require('express')
const playHistoryModel = require('../model/playHistoryModel')
const quizModel = require('../model/quizModel')
const { findOne } = require('../model/UserModel')
const UserModel = require('../model/UserModel')
const nodemailer = require('nodemailer');
const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const playHistorys = await playHistoryModel.find()
        res.status(201).json(playHistorys)
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post('/', async (req, res) => {
    console.log(req.body);

    // update quiz plays    
    try {
        let quizData = await quizModel.findOne({ _id: req.body.quizid })
        quizData.plays += 1
        const update = await quizModel.findOneAndUpdate({ _id: req.body.quizid }, quizData)
    } catch (err) {
        console.log(err)
    }

    // count total marks
    let totalMarks = 0;
    req.body.queandans.forEach(ques => {
        if (ques.iscorrect)
            totalMarks += ques.marks
    })
    const newPlayHistory = new playHistoryModel({
        studentid: req.userInfo._id,
        quizid: req.body.quizid,
        starttime: req.body.starttime,
        quizcompletiontime: req.body.quizcompletiontime,
        queandans: req.body.queandans,
        totalmarks: totalMarks
    })

    // save played quiz data
    try {
        const newPlayHistoryRes = await newPlayHistory.save()
        res.status(201).json(newPlayHistoryRes)
    } catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

router.get('/result/:playhistoryid', async (req, res) => {
    let result = {}, quizhistory, allStuPlaySameQuiz, studentData, quizData;
    try {
        quizhistory = await playHistoryModel.findOne({ _id: req.params.playhistoryid })
        allStuPlaySameQuiz = await playHistoryModel.find({ quizid: quizhistory.quizid })
        studentData = await UserModel.findOne({ _id: quizhistory.studentid })
        quizData = await quizModel.findOne({ _id: quizhistory.quizid })
    } catch (err) {
        res.status(400).json({ msg: "server error" })
    }


    let allStuPlaySameQuizWithStuInfo = await Promise.all(
        allStuPlaySameQuiz && allStuPlaySameQuiz.map(async (play) => {
            const studentDetail = await UserModel.findOne({ _id: play.studentid });
            if (studentDetail) {
                const playWithStudent = { ...play._doc, student: studentDetail };
                delete playWithStudent.studentid;
                return playWithStudent;
            }
        })
    );
    allStuPlaySameQuizWithStuInfo = allStuPlaySameQuizWithStuInfo.filter(stu => stu)
    allStuPlaySameQuizWithStuInfo.sort((a, b) => {
        // Compare totalmarks
        if (a.totalmarks !== b.totalmarks) {
            return b.totalmarks - a.totalmarks; // Higher marks first
        } else {
            // Convert quizcompletiontime to total seconds for comparison
            const timeA = a.quizcompletiontime.min * 60 + a.quizcompletiontime.sec;
            const timeB = b.quizcompletiontime.min * 60 + b.quizcompletiontime.sec;
            return timeA - timeB; // Less time first
        }
    });

    result.currentstudent = studentData
    result.currentstudentplayhistory = quizhistory
    result.quiz = quizData
    result.allstudents = allStuPlaySameQuizWithStuInfo
    res.status(201).json(result)
})

router.get('/quizdetail/:quizid', async (req, res) => {
    let quizdetail = {}
    try {
        const quizinfo = await quizModel.findOne({ _id: req.params.quizid })
        let allResults = await playHistoryModel.find({ quizid: req.params.quizid })


        for (let index in allResults) {
            const student = await UserModel.findOne({ _id: allResults[index].studentid })
            if (student)
                allResults[index] = { ...allResults[index]._doc, studentDetail: student }
            else
                allResults[index] = null
        }
        allResults = allResults.filter(allRes => allRes)
        allResults.sort((a, b) => {
            // Compare totalmarks
            if (a.totalmarks !== b.totalmarks) {
                return b.totalmarks - a.totalmarks; // Higher marks first
            } else {
                // Convert quizcompletiontime to total seconds for comparison
                const timeA = a.quizcompletiontime.min * 60 + a.quizcompletiontime.sec;
                const timeB = b.quizcompletiontime.min * 60 + b.quizcompletiontime.sec;
                return timeA - timeB; // Less time first
            }
        });
        res.status(201).json({ quizinfo: quizinfo, allResults: allResults })
    } catch (err) {
        console.log(err);
        res.status(402).json({ msg: "server error" })
    }
})

router.delete('/deleteMultiple', async (req, res) => {
    console.log(req.body.ids,131);
    
    try {
        const delegteplayhistory = await playHistoryModel.deleteMany({ _id: { $in: req.body.ids } })
        console.log(delegteplayhistory, 132)

        if (delegteplayhistory.deletedCount == req.body.ids.length)
            res.status(201).json({ success: true, message: "Deletion successful" });
        else{
            res.status(201).json({
                success: false,
                message: "Partial deletion - some documents not found",
                deletedCount: delegteplayhistory.deletedCount
            });
        }
    } catch (err) {
        console.log(err);
        res.status(402).json({ msg: "server error" })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const delegteplayhistory = await playHistoryModel.deleteOne({ _id: req.params.id })
        res.status(201).json(delegteplayhistory)
    } catch (err) {
        console.log(err);
        res.status(402).json({ msg: "server error" })
    }
})

router.post('/sendmail', async (req, res) => {
    try {
        // Get the list of Result IDs from the request body
        const { ResultIds } = req.body;
        
        // Ensure the list of Result IDs is not empty
        if (!ResultIds || !ResultIds.length) {
            return res.status(400).json({ msg: "No students provided." });
        }

        // Initialize nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'bhaveshkadachha9988@gmail.com',
                pass: 'ctun daua rurq pkes' // Consider using environment variables for security
            }
        });

        // Loop over each student ID to fetch details and send an email
        for (let ResultId of ResultIds) {
            // Fetch student's quiz result
            const studentResult = await playHistoryModel.findOne({ _id: ResultId });
            const student = await UserModel.findOne({ _id: studentResult.studentid });
            const quiz = await quizModel.findOne({ _id: studentResult.quizid });
            
            if (!student || !quiz) {
                console.log(`Missing data for Result ID ${ResultId}`);
                continue;
            }

            // Generate question list HTML
            const questionListHTML = studentResult.queandans
                .map((item, index) => `
                    <li>
                        Question ${index + 1}:
                        <ul>
                            <li>Attempted: ${item.isattempted ? "Yes" : "No"}</li>
                            <li>Correct: ${item.iscorrect ? "Yes" : "No"}</li>
                            <li>Marks Awarded: ${item.marks}</li>
                        </ul>
                    </li>
                `).join("");

            // Calculate completion time in MM:SS format
            const completionTime = `${studentResult.quizcompletiontime.min}m ${studentResult.quizcompletiontime.sec}s`;

            // Format start time
            const startTime = `${studentResult.starttime.day}-${studentResult.starttime.month}-${studentResult.starttime.year} ${studentResult.starttime.hour}:${studentResult.starttime.minute}`;

            // Email content
            const mailOptions = {
                from: "bhaveshkadachha9988@gmail.com",
                to: student.email,
                subject: "Quiz Results",
                html: `
                    <h1>Quiz Results for ${student.firstname} ${student.lastname}</h1>
                    <p><strong>Quiz Title:</strong> ${quiz.name}</p>
                    <p><strong>Quiz Description:</strong> ${quiz.description}</p>
                    <p><strong>Quiz Start Time:</strong> ${startTime}</p>
                    <p><strong>Quiz Completion Time:</strong> ${completionTime}</p>
                    <p><strong>Total Marks:</strong> ${studentResult.totalmarks}</p>
                    <h3>Question Details:</h3>
                    <ul>${questionListHTML}</ul>
                    <p>Thank you for participating in the quiz!</p>
                `
            }; 

            // Send email
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${student.email}`);
        }

        // Return success response after all emails are sent
        res.status(201).json({ msg: "Results sent to all students successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to send emails", error });
    }
});


router.post('/sendmail/:id', async (req, res) => {

    // get result from mongodb based on id
    const studentResult = await playHistoryModel.findOne({ _id: req.params.id })
    const student = await UserModel.findOne({ _id: studentResult.studentid })
    const quiz = await quizModel.findOne({ _id: studentResult.quizid })
    console.log(studentResult);
    console.log(student);
    console.log(quiz);



    // --------- Email Sending Code Start ---------
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'bhaveshkadachha9988@gmail.com',
            pass: 'ctun daua rurq pkes' // Consider using environment variables for security
        }
    });


    const questionListHTML = studentResult.queandans
        .map((item, index) => `
        <li>
          Question ${index + 1}:
          <ul>
            <li>Attempted: ${item.isattempted ? "Yes" : "No"}</li>
            <li>Correct: ${item.iscorrect ? "Yes" : "No"}</li>
            <li>Marks Awarded: ${item.marks}</li>
          </ul>
        </li>
      `)
        .join("");

    // Calculate completion time in MM:SS format
    const completionTime = `${studentResult.quizcompletiontime.min}m ${studentResult.quizcompletiontime.sec}s`;

    // Format start time
    const startTime = `${studentResult.starttime.day}-${studentResult.starttime.month}-${studentResult.starttime.year} ${studentResult.starttime.hour}:${studentResult.starttime.minute}`;

    // Email content
    const mailOptions = {
        from: "bhaveshkadachha9988@gmail.com",
        to: student.email,
        subject: "Quiz Results",
        html: `
        <h1>Quiz Results for ${student.firstname} ${student.lastname}</h1>
        <p><strong>Quiz Title:</strong> ${quiz.name}</p>
        <p><strong>Quiz Description:</strong> ${quiz.description}</p>
        <p><strong>Quiz Start Time:</strong> ${startTime}</p>
        <p><strong>Quiz Completion Time:</strong> ${completionTime}</p>
        <p><strong>Total Marks:</strong> ${studentResult.totalmarks}</p>
        <h3>Question Details:</h3>
        <ul>${questionListHTML}</ul>
        <p>Thank you for participating in the quiz!</p>
      `
    };
    // <p>To review the quiz, <ahref="http://localhost:3000/home/quizresult/6${studentResult._id}" target="_blank">click here</a>.</p>

    transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
            console.log(error);
            return res.status(400).json({ msg: "Failed to send result email", error });
        } else {
            console.log('Email sent: ' + info.response);
            return res.status(201).json({ msg: "result send to mail successfuly" });
        }
    });
})


module.exports = router  