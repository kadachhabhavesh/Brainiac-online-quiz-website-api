const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const quizModel = require("../model/quizModel");
const UserModel = require("../model/UserModel");


const router = express.Router();
const upload = multer({ dest: "uploads/" });


const reconstructNestedObject = (data) => {
  const result = {};
  for (let key in data) {
    const keys = key.split(/[\[\]]+/).filter(Boolean);
    keys.reduce((acc, curr, index) => {
      if (index === keys.length - 1) {
        acc[curr] = data[key];
      } else {
        acc[curr] = acc[curr] || (isNaN(keys[index + 1]) ? {} : []);
      }
      return acc[curr];
    }, result);
  }

  return result;
};

const getCode = async (length = 8) => {
  let code = '';
  let isUnique = false;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (!isUnique) {
    while (counter < length) {
      code += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    try {
      const quizWithCode = await quizModel.find({ code: code })
      if (quizWithCode.length <= 0) {
        isUnique = true
      }
    } catch (err) {
      console.log(err);
    }
  }
  return code;
}

router.post("/", upload.any(), async (req, res) => {
  const data = req.body;
  // Parsing file fields and ensuring correct file type
  req.files.forEach((file) => {
    const keys = file.fieldname.split(/[\[\]]+/).filter(Boolean);
    keys.reduce((acc, curr, index) => {
      if (index === keys.length - 1) {
        acc[curr] = file;
      } else {
        acc[curr] = acc[curr] || {};
      }
      return acc[curr];
    }, data);
  });
  const quizObject = reconstructNestedObject(data);
  console.log(quizObject);
  const code = await getCode()
  console.log(code);
  const quiz = quizModel({
    name: quizObject.name,
    description: quizObject.description,
    image: quizObject.image.path,
    grade: quizObject.grade,
    difficultylevel: quizObject.difficultylevel,
    starttime: {
      year: quizObject.starttime.year,
      month: quizObject.starttime.month,
      day: quizObject.starttime.day,
      hour: quizObject.starttime.hour,
      minute: quizObject.starttime.minute,
    },
    duration: quizObject.duration,
    subject: quizObject.subject,
    showresult: quizObject.showresult,
    private: quizObject.private,
    password: quizObject.password,
    creator: req.userInfo._id,
    code: code,
    questions: quizObject.questions.map((question) => {
      return {
        question: question.question,
        image: question.image!="null" && ( question.image!=null ? question.image.path : null),
        explanation: question.explanation ? question.explanation : null,
        marks: question.marks,
        options: question.options.map((option) => {
          return {
            option: option.option,
            isTrue: option.isTrue,
          };
        }),
      };
    })
  });

  try {
    console.log(quiz);
    const uploadQuiz = await quiz.save();
    res.json({ message: "Data received successfully", quiz });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }

});


router.put("/:quizid", upload.any(), async (req, res) => {
  try {
    const data = req.body;
    // Attach files to the data object
    req.files.forEach((file) => {
      const keys = file.fieldname.split(/[\[\]]+/).filter(Boolean);
      keys.reduce((acc, curr, index) => {
        if (index === keys.length - 1) {
          acc[curr] = file;
        } else {
          acc[curr] = acc[curr] || {};
        }
        return acc[curr];
      }, data);
    });

    // Convert the flat form data to a nested object
    const quizObject = reconstructNestedObject(data);

    // Find the quiz by ID and update it with new data
    const updatedQuiz = await quizModel.findByIdAndUpdate(
      req.params.quizid,
      {
        $set: {
          name: quizObject.name,
          description: quizObject.description,
          image: typeof(quizObject.image)==='object' ? quizObject.image.path : quizObject.image,
          grade: quizObject.grade,
          difficultylevel: quizObject.difficultylevel,
          starttime: {
            year: quizObject.starttime.year,
            month: quizObject.starttime.month,
            day: quizObject.starttime.day,
            hour: quizObject.starttime.hour,
            minute: quizObject.starttime.minute,
          },
          duration: quizObject.duration,
          subject: quizObject.subject,
          showresult: quizObject.showresult,
          private: quizObject.private,
          password: quizObject.password,
          questions: quizObject.questions.map((question) => {
            return {
              question: question.question,
              image: question.image !== "null" ? question.image.path : null,
              explanation: question.explanation ? question.explanation : null,
              marks: question.marks,
              options: question.options.map((option) => {
                return {
                  option: option.option,
                  isTrue: option.isTrue,
                };
              }),
            };
          }),
        },
      },
      { new: true, runValidators: true } // Options to return the updated document
    );

    // If quiz is not found, return an error
    if (!updatedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Return the updated quiz
    res.json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// router.get("/", async (req, res) => {
//   const currentTime = new Date();
//   try {
//     const quizzes = await quizModel.find()
//     res.status(201).json(quizzes)
//   } catch (err) {
//     res.status(400).status(err)
//   }
// });

router.get("/", async (req, res) => {
  try {
    let quizzes = await quizModel.find().lean();

    for (let quiz in quizzes) {
      const creator = await UserModel.findOne({ _id: quizzes[quiz].creator })
      console.log(creator);
      quizzes[quiz] = { ...quizzes[quiz], creator: creator }
    }
    res.status(200).json(quizzes);
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: err.message }); 
  }
});

// get quizziz create by specific teacher
router.get("/teacherquiz", async (req, res) => {
  try {
    const quizziz = await quizModel.find({ creator: req.userInfo._id })
    res.status(201).json(quizziz)
  } catch (err) {
    res.status(400).json({ msg: err })
  }
})

router.get('/:quizid', async (req, res) => {
  try {
    const quizres = await quizModel.findOne({ _id: req.params.quizid })
    if (!quizres)
      res.status(400).json({ msg: "quiz not found" })
    const creator = await UserModel.findOne({ _id: quizres.creator })
    if (!creator)
      res.status(400).json({ msg: "creator not found" })
    const quiz = quizres._doc
    quiz.creator = creator
    res.status(201).json(quizres)
  } catch (err) {
    res.status(400).json({ msg: err })
  }
})

router.get("/quizbycode/:code", async (req, res) => {
  try {
    console.log(req.params.code,244);
    const quizData = await quizModel.findOne({ code:req.params.code })
    console.log(quizData,247);
    if(quizData)
      res.status(201).json(quizData)
    else
      res.status(501).json({msg:"quiz not found",found:false})
  } catch (err) {
    
    res.status(400).json({ msg: err })
  }
})

router.delete("/:quizid", async (req, res) => {
  try {
    console.log(req.params.quizid);
    const deleteQuiz = await quizModel.deleteOne({ _id: req.params.quizid })
    res.status(201).json({ msg: "success" })
  } catch (err) {
    res.status(400).json(err)
  }

})

router.post("/json/:id", async (req, res) => {
  try {
    const quiz = await quizModel.findOne({ _id: req.params.id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    const newQuestions = req.body;
    const updatedQuestions = [...quiz.questions, ...newQuestions];
    quiz.questions = updatedQuestions;
    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;