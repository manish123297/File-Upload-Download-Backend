const path = require("path");
const express = require("express");
const multer = require("multer");
const File = require("../model/file");
const Router = express.Router();
// multer function that takes certain options as arguments
// 1.We pass the dest (destination) option and the value of dest will be:files

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      //The destination option is a callback function that takes three arguments:
      //1. req, which is the incoming request object.
      // 2. file, which is the incoming file object .
      // 3.cb, which is again another callback function.
      cb(null, "./files");
      //   We call the cb function that takes the two arguments.
      //  The first is error which we are going to pass null to.
      //  The second is the destination folder which is files.
    },
    filename(req, file, cb) {
      // filename->It is almost the same as the destination option except in this,
      //  the inner callback function takes the filename as the second argument.
      cb(null, `${new Date().getTime()}_${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 1000000, // max file size 1MB = 1000000 bytes
  },
  fileFilter(req, file, cb) {
    // Multer filter is just a function that also has req, file, and a callback function as its-
    // arguments
    // we will check if the uploaded files are PDFs, if so we will pass true in the callback function.
    //  If it isn’t a PDF, we will pass false along with an error in the callback function. If you want
    //  to filter  out some other files like images, you can do that easily by checking the mimetype of
    // the uploaded files.
    if (!file.originalname.match(/\.(jpeg|jpg|png|pdf|doc|docx|xlsx|xls)$/)) {
      return cb(
        new Error(
          "only upload files with jpg, jpeg, png, pdf, doc, docx, xslx, xls format."
        )
      );
    }
    // If the file extension matches with either jpeg|jpg|png|pdf|doc|docx|xlsx|xls then we
    //  allow the file to upload by calling the callback function cb(undefined, true) otherwise
    // we will throw an error.

    // If we call cb(undefined, false) inside the fileFilter function, then the file will always be
    //  rejected and will not be uploaded.
    cb(undefined, true); // continue with upload
  },
});
// Route to get and save file in server as well in database

Router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    // upload.single is again a function. The single determines that only a
    //  single file is to be uploaded. In the case of there being many files,
    //  we can use multiple instead of single.
    try {
      const { title, description } = req.body;
      const { path, mimetype } = req.file;
      const file = new File({
        title,
        description,
        file_path: path,
        file_mimetype: mimetype,
      });
      await file.save();
      res.send("file uploaded successfully.");
    } catch (error) {
      res.status(400).send("Error while uploading file. Try again later.");
    }
  },
  (error, req, res, next) => {
    if (error) {
      res.status(500).send(error.message);
    }
  }
);

// To send All  Data  of database to Froentend----------------------------------------------->
Router.get("/getAllFiles", async (req, res) => {
  try {
    const files = await File.find({});
    const sortedByCreationDate = files.sort(
      (a, b) => b.createdAt - a.createdAt
    );
    res.send(sortedByCreationDate);
  } catch (error) {
    res.status(400).send("Error while getting list of files. Try again later.");
  }
});
// ------------------------------------------------------------------------>
// To Download a particular file

Router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    //  we're checking if any such file exists with the provided id. If it exists then
    //  we're sending back the file stored in the files folder by setting the content-type
    //  of the file first.

    // Setting the content-type is very important to get the file in the correct format
    //  as we're not just uploading images but also doc, xls and pdf files. So to correctly
    // send back the file content, the content-type is required.
    res.set({
      "Content-Type": file.file_mimetype,
    });
    res.sendFile(path.join(__dirname, "..", file.file_path));
  } catch (error) {
    res.status(400).send("Error while downloading file. Try again later.");
  }
});

module.exports = Router;
