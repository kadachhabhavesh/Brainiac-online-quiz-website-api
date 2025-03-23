const express = require("express");
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const nodemailer = require('nodemailer');
const userModel = require("../model/UserModel");
const quizModel = require("../model/quizModel");
const playHistoryModel = require("../model/playHistoryModel");
const UserModel = require("../model/UserModel");
const playlistModel = require("../model/playListModel");

const router = express.Router();

function generateOTP() {
  let digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

router.get("/admin", async (req, res) => {
  try {
    let student = [], teacher = [];
    let users = await UserModel.find()

    await Promise.all(users.map(async (user) => {
      if (user.usertype === "student") {
        let totalmarks = 0, correctmarks = 0
        const results = await playHistoryModel.find({ studentid: user._id });
        for (let result of results) {
          for (let quizresult of result.queandans) {
            totalmarks += quizresult.marks
            if (quizresult.iscorrect)
              correctmarks += quizresult.marks
          }
        }
        user = { ...user._doc, totalquiz: results.length, totalmarks: totalmarks, correctmarks: correctmarks }
        student.push(user)
      } else if (user.usertype === "teacher") {
        let totalquizCreated = 0
        const result = await quizModel.find({ creator: user._id });

        for (let playForQuiz in result) {
          const demo = await playHistoryModel.find({ quizid: result[playForQuiz]._id })
          totalquizCreated += demo.length
        }
        user = { ...user._doc, totalquizcreated: result.length, totalplays: totalquizCreated }
        teacher.push(user);
      }
    }));

    res.json({
      student: student,
      teacher: teacher,
    })
  } catch (err) {
    console.error(`Error fetching profile: ${err}`);
    res.status(400).send(err);
  }
})

router.get("/admin/:usertype", async (req, res) => {

  if (!(req.params.usertype == "students" || req.params.usertype == "teachers")) {
    res.status(404).json({ "msg": "invalid endpoint" })
    return
  }

  let student = [], teacher = [];
  let users = await UserModel.find()

  try {
    if (req.params.usertype == "students") {
      await Promise.all(users.map(async (user) => {
        if (user.usertype === "student") {
          let totalmarks = 0, correctmarks = 0
          const results = await playHistoryModel.find({ studentid: user._id });
          for (let result of results) {
            for (let quizresult of result.queandans) {
              totalmarks += quizresult.marks
              if (quizresult.iscorrect)
                correctmarks += quizresult.marks
            }
          }
          user = { ...user._doc, totalquiz: results.length, totalmarks: totalmarks, correctmarks: correctmarks }
          student.push(user)
        }
      }));
      res.json(student)
    }else if(req.params.usertype == "teachers"){
      await Promise.all(users.map(async (user) => {
        if (user.usertype === "teacher") {
          let totalquizCreated = 0
          const result = await quizModel.find({ creator: user._id });
  
          for (let playForQuiz in result) {
            const demo = await playHistoryModel.find({ quizid: result[playForQuiz]._id })
            totalquizCreated += demo.length
          }
          user = { ...user._doc, totalquizcreated: result.length, totalplays: totalquizCreated }
          teacher.push(user);
        }
      }));
      res.json(teacher)
    }
  } catch (err) {
    console.error(`Error fetching profile: ${err}`);
    res.status(400).send(err);
  }
})

// Signup Route
router.post("/signup", async (req, res) => {
  const newUser = new userModel({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    usertype: req.body.usertype,
    Emailverified: false
  });

  try {
    // Check if email already exists
    const user = await userModel.findOne({ email: req.body.email });

    if (!user) {
      const signUpRes = await newUser.save();
      res.json(signUpRes);
    } else {
      return res.status(400).json({ msg: "Email already exists" });
    }
  } catch (err) {
    return res.status(400).send(err);
  }
});

router.get("/getuserbyjwt", auth, (req, res) => {
  res.status(201).send(req.userInfo)
})

router.get("/:userid", async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.params.userid })
    res.status(201).json(user)
  } catch (err) {
    res.status(400).json(err)
  }

})

router.post("/login", async (req, res) => {
  try {
    const userInfo = await userModel.findOne({ email: req.body.email })
    if (userInfo && userInfo.password === req.body.password && userInfo.Emailverified) {
      const token = jwt.sign({ _id: userInfo._id.toString() }, "kZUhYBsxaAzPnbZUmRoWmlFGkfxXIuwR")
      res.cookie("jwt", token);
      res.cookie("name", "bhavesh");
      if (userInfo.usertype === "admin")
        res.status(201).json({ msg: "login successfull", admin: true })
      else
        res.status(201).json({ msg: "login successfull", admin: false })
    } else {
      if (!userInfo.Emailverified)
        res.status(400).json({ "msg": "Please verify your email", "incorrect": true, "emailverified": false, "userId": userInfo._id })
      else
        res.status(400).json({ "msg": "incorrect email or password", "incorrect": true, "emailverified": true, "userId": userInfo._id })
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/forgotpass", async (req, res) => {
  try {
    const userInfo = await userModel.findOneAndUpdate({ email: req.body.email }, {
      password: req.body.password
    })
    if (userInfo == null)
      res.status(400).json({ msg: "incorrect email" })
    else
      res.status(201).json({ msg: "password change successfuly" })

  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/profile/:userid", async (req, res) => {
  let createdQuiz, playlist;
  try {
    let user = await userModel.findOne({ _id: req.params.userid });
    let results = await playHistoryModel.find({ studentid: req.params.userid });


    createdQuiz = await quizModel.find({ creator: req.params.userid })

    results = await Promise.all(results.map(async (result) => {
      const resultObj = result.toObject();
      const quiz = await quizModel.findOne({ _id: result.quizid });
      resultObj.quizinfo = quiz;
      if (quiz)
        return resultObj
    }));
    results = results.filter(resu => resu)

    if (user.usertype === "teacher") {
      playlist = await playlistModel.find({ creator: req.params.userid })
      playlist = await Promise.all(playlist.map(async pl => {
        pl = pl._doc
        pl.quizziz = await Promise.all(pl.quizziz.map(async quiz => {
          const quizForId = await quizModel.findOne({ _id: quiz })
          return quizForId
        }))
        return { ...pl }
      }))

      let totalplays = 0
      await Promise.all(createdQuiz.map(async (quiz) => {
        const results = await playHistoryModel.find({ quizid: quiz._id })
        totalplays += results.length;
      }))



      user = { ...user._doc, totalplays: totalplays }
    }

    const profile = {
      userinfo: user,
      results: results,
      createdquiz: user.usertype === "teacher" && createdQuiz,
      playlist: user.usertype === "teacher" && playlist
    };
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

router.delete('/:userid', async (req, res) => {
  try {
    console.log(req.params.id);
    const delUser = await UserModel.findByIdAndDelete({ _id: req.params.userid })
    console.log(delUser);
    res.status(201).json(delUser)
  } catch (err) {
    res.status(400).send(err);
  }
})

router.put('/updateUser/:id', async (req, res) => {
  console.log(req.body,255);
  console.log(req.params.id);
  
  let id = req.params.id;
  try {
      const result = await userModel.findOneAndUpdate(
          { _id: id }, 
          { 
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            password:req.body.password,
            usertype:req.body.usertype,
            Emailverified:req.body.Emailverified
          }
      );

      if (!result) {
          return res.status(404).json({"msg":"User not found"});
      }

      res.status(200).json({"msg":"user update successfully"}); // Send back the updated user details
  } catch (error) {
      res.status(500).json({"msg":"Error updating user: " + error.message});
  }
});

router.put("/:userId", async (req, res) => {

  console.log(req.body, 248);

  try {
    const user = await UserModel.findOne({ _id: req.params.userId })
    console.log(req.body.otp, 216);
    console.log(user);

    if (user.OTP.OTP == req.body.otp) {
      
      const updateUser = await UserModel.findByIdAndUpdate({ _id: req.params.userId },{ Emailverified: true })

      console.log(updateUser);
      res.status(201).json(updateUser)
    } else {
      res.status(400).json({ msg: "incorrect OTP" })
    }
  } catch (err) {
    res.status(400).send(err);
  }
})

router.put("/sendotp/:userId", async (req, res) => {
  const otp = generateOTP();
  const user = await UserModel.findById({ _id: req.params.userId })

  // --------- Email Sending Code Start ---------
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bhaveshkadachha9988@gmail.com',
      pass: 'ctun daua rurq pkes' // Consider using environment variables for security
    }
  });

  var mailOptions = {
    from: 'bhaveshkadachha9988@gmail.com',
    to: user.email,  // Send OTP to the registered email
    subject: 'Email Verification',
    text: 'Your OTP for email verification is ' + otp
  };

  transporter.sendMail(mailOptions, async function (error, info) {
    if (error) {
      console.log(error);
      return res.status(400).json({ msg: "Failed to send verification email", error });
    } else {
      console.log('Email sent: ' + info.response);
      // return res.status(201).json({
      //   msg: "Signup successful. OTP sent to your email for verification.",
      //   user: signUpRes
      // });
      console.log(mailOptions, 263);

      // update user with OTP
      let updatedUser;
      try {
        updatedUser = await UserModel.findByIdAndUpdate(
          { _id: req.params.userId },
          {
            $set: {
              "OTP.OTP": otp,
              "OTP.createdAt": Date.now()
            }
          },
          { upsert: true, new: true }
        )
        return res.status(201).json({
          msg: "OTP sent to your email for verification.",
          user: updatedUser
        });
      } catch (err) {
        res.status(400).json({ "msg": "user not found" })
      }
    }
  });
  // --------- Email Sending Code End ---------




})


module.exports = router

